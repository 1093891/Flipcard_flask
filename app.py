from flask import Flask,render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flashcards.db'
db = SQLAlchemy(app)
index = 0
class FlipCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    front = db.Column(db.String(100), nullable=False)
    back = db.Column(db.String(200), nullable=False)

# Create the database
with app.app_context():
    db.create_all()
    if not FlipCard.query.first():
        card1 = FlipCard(front="Capital city of France", back="Paris")
        card2 = FlipCard(front="Question", back="Answer")
        db.session.add_all([card1, card2])
        db.session.commit()

@app.route('/')
def index():
    cards = FlipCard.query.all()
    print(cards)
    if not cards:
        return {

        }
    return render_template('index.html', cards=cards)
@app.route('/add', methods=['POST'])
def add():
    card_front = request.form['front']
    new_front = FlipCard(front=card_front)
    db.session.add(new_front)
    db.session.commit()
    card_back = request.form['back']
    new_back = FlipCard(back=card_back)
    db.session.add(new_back)
    db.session.commit()
    return redirect('/')

@app.route('/delete/<int:id>')
def delete(id):
    task = FlipCard.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    return redirect('/')

@app.route('/next/<int:id>')
def next_card(id):
    global index
    cards = FlipCard.query.all()
    if not cards:
        return redirect('/')
    index = (index + 1) % len(cards)
    return render_template('index.html', cards=cards, current_card=cards[index])



if __name__ == '__main__':
    app.run()
