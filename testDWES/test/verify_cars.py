from app import app, db, Car

def test_cars():
    # Create tables
    with app.app_context():
        db.create_all()
        
        # Clear existing cars for clean test
        Car.query.delete()
        db.session.commit()

    client = app.test_client()

    # Test GET (empty)
    response = client.get('/cars')
    assert response.status_code == 200
    assert b"No cars found" in response.data
    print("GET /cars (empty) passed")

    # Test POST (create car)
    response = client.post('/cars', data={
        'brand': 'Toyota',
        'model': 'Corolla',
        'price': '20000'
    }, follow_redirects=True)
    assert response.status_code == 200
    print("POST /cars passed")

    # Test GET (populated)
    response = client.get('/cars')
    assert response.status_code == 200
    assert b"Toyota" in response.data
    assert b"Corolla" in response.data
    assert b"20000" in response.data
    print("GET /cars (populated) passed")

if __name__ == '__main__':
    test_cars()
