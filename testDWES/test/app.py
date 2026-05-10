from models import User, Car, db, app
from controllers.todo_controller import todo_bp
from flask import request, render_template, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash

app.register_blueprint(todo_bp)

@app.route('/cars', methods=['GET', 'POST'])
def cars():
    if request.method == 'POST':
        brand = request.form.get('brand')
        model = request.form.get('model')
        price = request.form.get('price')
        if brand and model and price:
            new_car = Car(brand, model, float(price))
            db.session.add(new_car)
            db.session.commit()
    
    search_query = request.args.get('search')
    if search_query:
        cars = Car.query.filter((Car.brand.contains(search_query)) | (Car.model.contains(search_query))).all()
    else:
        cars = Car.query.all()
    
    # Deduplicate cars
    unique_cars = []
    seen_cars = set()
    for car in cars:
        car_tuple = (car.brand, car.model, car.price)
        if car_tuple not in seen_cars:
            seen_cars.add(car_tuple)
            unique_cars.append(car)
    cars = unique_cars

    return render_template('main.html', cars=cars)

@app.route('/')
def index():
    return 'Hello World'

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return redirect(url_for('cars'))
        else:
            return "Invalid credentials" # Simple error for now
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            return "User already exists"
            
        hashed_password = generate_password_hash(password)
        new_user = User(username, hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)