from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
import pymysql.cursors

app = Flask(__name__)
app.secret_key = "change_this_to_a_random_secret_key"
CORS(app, supports_credentials=True)

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Harsha@2004",  # <-- Change this
    "database": "ecommerce_db",
    "cursorclass": pymysql.cursors.DictCursor,
    "autocommit": False
}


def get_db_connection():
    return pymysql.connect(**DB_CONFIG)


# Serve Frontend
@app.route("/")
def index():
    return render_template("index.html")


# 1. GET PRODUCTS (with optional search & category filter)
@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category", "").strip()
    search = request.args.get("q", "").strip()
    sort = request.args.get("sort", "newest").strip()

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """SELECT id, name, category, description, price, mrp, rating, stock, image_url
                     FROM products WHERE 1=1"""
            params = []

            if category and category != "All":
                sql += " AND category = %s"
                params.append(category)

            if search:
                sql += " AND (name LIKE %s OR description LIKE %s OR category LIKE %s)"
                like_term = f"%{search}%"
                params.extend([like_term, like_term, like_term])

            # Sorting like Flipkart / Amazon
            if sort == "price_asc":
                sql += " ORDER BY price ASC"
            elif sort == "price_desc":
                sql += " ORDER BY price DESC"
            elif sort == "rating_desc":
                sql += " ORDER BY rating DESC"
            else:
                sql += " ORDER BY id DESC"

            cursor.execute(sql, params)
            products = cursor.fetchall()

            for p in products:
                p["price"] = float(p["price"])
                p["mrp"] = float(p["mrp"]) if p["mrp"] else p["price"]
                p["rating"] = float(p["rating"]) if p["rating"] else 4.3

            return jsonify(products), 200
    finally:
        conn.close()

# 2. USER REGISTRATION
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or len(password) < 6:
        return jsonify({"error": "Name, valid email, and password (min 6 chars) required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "Email already registered"}), 409

            hashed_pw = generate_password_hash(password)
            cursor.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
                (name, email, hashed_pw)
            )
            conn.commit()
            user_id = cursor.lastrowid

            session["user_id"] = user_id
            session["user_name"] = name
            session["user_email"] = email

            return jsonify({"id": user_id, "name": name, "email": email}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# 3. USER LOGIN
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, name, email, password_hash FROM users WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()

            if not user or not check_password_hash(user["password_hash"], password):
                return jsonify({"error": "Invalid email or password"}), 401

            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            session["user_email"] = user["email"]

            return jsonify({
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }), 200
    finally:
        conn.close()


# 4. CHECK CURRENT SESSION / LOGOUT
@app.route("/api/me", methods=["GET"])
def current_user():
    if "user_id" in session:
        return jsonify({
            "id": session["user_id"],
            "name": session["user_name"],
            "email": session["user_email"]
        }), 200
    return jsonify({"user": None}), 200


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200


# 5. PLACE ORDER (Transnational Checkout using PyMySQL Cursor)
@app.route("/api/checkout", methods=["POST"])
def checkout():
    data = request.get_json()
    customer_name = (data.get("customer_name") or "").strip()
    customer_email = (data.get("customer_email") or "").strip()
    shipping_address = (data.get("shipping_address") or "").strip()
    items = data.get("items") or []

    if not customer_name or not customer_email or not shipping_address or not items:
        return jsonify({"error": "Please fill all shipping details and have items in cart"}), 400

    conn = get_db_connection()
    try:
        conn.begin()
        with conn.cursor() as cursor:
            total_amount = 0.0
            verified_items = []

            for item in items:
                product_id = int(item["product_id"])
                qty = int(item["quantity"])
                if qty <= 0:
                    raise ValueError("Invalid quantity")

                # Lock row for update to prevent race conditions on stock
                cursor.execute(
                    "SELECT id, name, price, stock FROM products WHERE id = %s FOR UPDATE",
                    (product_id,)
                )
                product = cursor.fetchone()

                if not product:
                    raise ValueError(f"Product ID {product_id} not found")
                if product["stock"] < qty:
                    raise ValueError(f"Insufficient stock for {product['name']} (Available: {product['stock']})")

                unit_price = float(product["price"])
                total_amount += unit_price * qty
                verified_items.append({
                    "product_id": product["id"],
                    "quantity": qty,
                    "unit_price": unit_price
                })

                # Deduct stock
                cursor.execute(
                    "UPDATE products SET stock = stock - %s WHERE id = %s",
                    (qty, product["id"])
                )

            # Insert Order
            user_id = session.get("user_id")
            cursor.execute(
                """INSERT INTO orders (user_id, customer_name, customer_email, shipping_address, total_amount)
                   VALUES (%s, %s, %s, %s, %s)""",
                (user_id, customer_name, customer_email, shipping_address, round(total_amount, 2))
            )
            order_id = cursor.lastrowid

            # Insert Order Items
            for v_item in verified_items:
                cursor.execute(
                    """INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                       VALUES (%s, %s, %s, %s)""",
                    (order_id, v_item["product_id"], v_item["quantity"], v_item["unit_price"])
                )

        conn.commit()
        return jsonify({
            "message": "Order placed successfully!",
            "order_id": order_id,
            "total_amount": round(total_amount, 2)
        }), 201

    except ValueError as ve:
        conn.rollback()
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Server error during checkout: " + str(e)}), 500
    finally:
        conn.close()


# 6. GET USER ORDERS
@app.route("/api/orders", methods=["GET"])
def get_orders():
    if "user_id" not in session:
        return jsonify({"error": "Please login to view your orders"}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT id, total_amount, status, shipping_address, created_at
                   FROM orders WHERE user_id = %s ORDER BY created_at DESC""",
                (session["user_id"],)
            )
            orders = cursor.fetchall()

            for order in orders:
                order["total_amount"] = float(order["total_amount"])
                order["created_at"] = order["created_at"].strftime("%Y-%m-%d %H:%M")
                cursor.execute(
                    """SELECT oi.quantity, oi.unit_price, p.name AS product_name
                       FROM order_items oi
                       JOIN products p ON oi.product_id = p.id
                       WHERE oi.order_id = %s""",
                    (order["id"],)
                )
                items = cursor.fetchall()
                for it in items:
                    it["unit_price"] = float(it["unit_price"])
                order["items"] = items

            return jsonify(orders), 200
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)