from flask import Flask, render_template, request, redirect, jsonify
from flask_sqlalchemy import SQLAlchemy
import os # Import os module to handle path for database

app = Flask(__name__)

# Configure database URI
# Ensure the database file is in the same directory as app.py or specify a full path
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'flashcards.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Suppress SQLAlchemy warning

db = SQLAlchemy(app)

class FlipCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    front = db.Column(db.String(100), nullable=False)
    back = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<FlipCard {self.id}: {self.front}>'

# Create the database and seed initial data
with app.app_context():
    db.create_all()
    # Only seed if no cards exist to avoid duplicate entries on every restart
    if not FlipCard.query.first():
        card1 = FlipCard(front="Capital city of France", back="Paris")
        card2 = FlipCard(front="Largest planet in our solar system", back="Jupiter")
        card3 = FlipCard(front="The smallest prime number", back="2")
        db.session.add_all([card1, card2, card3])
        db.session.commit()

# Route to display the initial page
@app.route('/')
def index():
    cards = FlipCard.query.all()
    current_card = None
    first_card_id = ''
    cards_available = False

    if cards:
        current_card = cards[0]
        first_card_id = cards[0].id
        cards_available = True

    return render_template(
        'index.html',
        current_card=current_card,
        cards_available=cards_available,
        total_cards=len(cards) if cards else 0,
        first_card_id=first_card_id
    )

# AJAX endpoint to get next card data
@app.route('/next_card_data/<int:current_card_id>')
def next_card_data(current_card_id):
    # Ensure consistent order for sequential access
    cards = FlipCard.query.order_by(FlipCard.id).all()
    if not cards:
        return jsonify({}) # No cards available

    # Find the index of the current card based on its ID
    current_idx = -1
    for i, card in enumerate(cards):
        if card.id == current_card_id:
            current_idx = i
            break

    # If current card not found or it's the last card, loop back to the first
    if current_idx == -1 or current_idx == len(cards) - 1:
        next_card = cards[0]
    else:
        next_card = cards[current_idx + 1]

    # Return next card's data as JSON
    return jsonify({'front': next_card.front, 'back': next_card.back, 'id': next_card.id})


# AJAX endpoint for adding cards
@app.route('/add_card_ajax', methods=['POST'])
def add_card_ajax():
    data = request.get_json()
    card_front = data.get('front')
    card_back = data.get('back')

    if not card_front or not card_back:
        return jsonify({'success': False, 'message': 'Both front and back are required.'}), 400

    new_card = FlipCard(front=card_front, back=card_back)
    try:
        db.session.add(new_card)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Card added successfully!', 'card_id': new_card.id})
    except Exception as e:
        db.session.rollback()
        # Log the error for debugging
        app.logger.error(f"Error adding card: {e}")
        return jsonify({'success': False, 'message': 'Failed to add card. Please try again.'}), 500

# Modified delete route to handle AJAX and return JSON
@app.route('/delete/<int:card_id>', methods=['POST']) # Use card_id for clarity
def delete(card_id):
    card_to_delete = FlipCard.query.get(card_id)
    if not card_to_delete:
        return jsonify({'success': False, 'message': 'Card not found.'}), 404
    try:
        db.session.delete(card_to_delete)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Card deleted successfully.'})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting card: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete card. Please try again.'}), 500


if __name__ == '__main__':
    app.run(debug=True) # Run in debug mode for easier development