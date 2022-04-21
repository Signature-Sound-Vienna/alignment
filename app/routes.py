from flask import Flask, url_for, render_template
from app import app

@app.route("/")
def index():
    return render_template('index.html')
@app.route("/old")
def old():
    return render_template('old.html')


