# 🌍 SafeRoute AI – Disaster Evacuation Planner

**SafeRoute AI** is a web-based disaster evacuation planning application designed to help users prepare for emergencies and access essential disaster safety information. The application provides user authentication, an evacuation map interface, and an emergency chatbot that offers general safety guidance for different disaster scenarios.

## ✨ Features

- **User Authentication:** User registration and login with securely hashed passwords.
- **Dashboard:** Personalized dashboard for logged-in users.
- **Evacuation Map:** Map interface for selecting locations and exploring evacuation routes.
- **Emergency Chatbot:** Provides general safety guidance for floods, earthquakes, fires, cyclones, landslides, and emergency preparedness.
- **Emergency Assistance:** Dedicated emergency page for accessing emergency-related information.
- **Session Management:** Restricts selected application pages to authenticated users.
- **SQLite Database:** Stores user account information locally.
- **Input Validation:** Validates registration details, password length, and chatbot input.
- **Emergency Keyword Detection:** Recognizes selected urgent phrases and advises users to contact emergency services.

 ## 📸 Screenshots

Explore the different screens of the SafeRoute AI Disaster Evacuation Planner.

> **Note:** Replace the example filenames below with the exact image filenames present in the `Outputs` folder.

### 🔐 Login Page

![Login Page](Outputs/login.png)

### 📝 Registration Page

![Registration Page](Outputs/register.png)

### 🏠 Dashboard

![Dashboard](Outputs/dashboard.png)

### 🗺️ Evacuation Map

![Evacuation Map](Outputs/map.png)

### 💬 Emergency Chatbot

![Emergency Chatbot](Outputs/chatbot.png)

### 🚨 Emergency Assistance

![Emergency Assistance](Outputs/emergency.png)

---

📂 [View all screenshots in the Outputs folder](https://github.com/kaviya257/disaster_evacuation_planner/tree/main/Outputs)

## 🛠️ Tech Stack

- **Backend:** Python, Flask
- **Frontend:** HTML, CSS, JavaScript, Jinja2 templates
- **Database:** SQLite
- **Security:** Werkzeug password hashing and Flask sessions
- **Version Control:** Git and GitHub

## 📁 Project Structure

```text
disaster_evacuation_planner/
│
├── app.py                  # Flask application and routes
├── templates/
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── dashboard.html      # User dashboard
│   ├── map.html            # Evacuation map interface
│   ├── chatbot.html        # Emergency chatbot interface
│   └── emergency.html      # Emergency assistance page
│
├── saferoute.db            # Local SQLite database (not committed)
├── .gitignore              # Files excluded from Git
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
```

*The structure above is illustrative. Adjust the filenames to match your actual project.*

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.10 or later
- Git
- A web browser

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/disaster_evacuation_planner.git
cd disaster_evacuation_planner
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Create a virtual environment

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies

If `requirements.txt` exists, run:

```bash
pip install -r requirements.txt
```

If you do not have a dependency file yet, install the packages used by the application:

```bash
pip install Flask Werkzeug
```

Save the installed dependencies:

```bash
pip freeze > requirements.txt
```

### 4. Configure the Flask secret key

Set a secure secret key before running the application.

**PowerShell:**

```powershell
$env:FLASK_SECRET_KEY = "replace-with-a-strong-random-secret"
```

Use a different, randomly generated secret for your own environment. Never commit production secrets to GitHub.

### 5. Run the application

```bash
python app.py
```

Open your browser and visit:

```text
http://127.0.0.1:5000
```

The SQLite database and required user table are initialized by the application when it starts.

## 💬 Emergency Chatbot Capabilities

The chatbot responds to common disaster-related questions using predefined safety guidance.

| Topic | Example question |
|---|---|
| Floods | What should I do during a flood? |
| Earthquakes | What should I do during an earthquake? |
| Fires | What should I do if there is a fire? |
| Cyclones | How can I stay safe during a cyclone? |
| Landslides | What should I do during a landslide? |
| Emergency kits | What should I keep in an emergency kit? |
| Evacuation | How should I prepare to evacuate? |

The chatbot also detects certain urgent phrases and recommends contacting emergency services.

## 🔐 Security Considerations

- Passwords are stored as hashes rather than plaintext.
- SQL queries use parameterized inputs for user-related operations.
- Selected routes require an authenticated session.
- Secret keys should be configured through environment variables.
- The local database and environment files should not be committed to the repository.

Before production deployment, disable Flask debug mode, use a strong secret key, and review session cookie settings and other security requirements.

## ⚠️ Disclaimer

SafeRoute AI is an educational prototype intended to support disaster preparedness and provide general safety information.

**The evacuation map and suggested routes are not verified as safe in real time.** The chatbot does not replace emergency responders, official disaster alerts, or local authorities. Always follow official evacuation orders and verify road and shelter conditions through reliable sources.

In India, call **112** for emergency assistance when someone is in immediate danger.

## 🚀 Future Enhancements

- Integration with live weather alerts and disaster notifications.
- Verified evacuation routes using real-time road and hazard data.
- Official shelter locations and availability.
- Location-aware emergency notifications.
- Multilingual chatbot support.
- Improved accessibility and mobile-responsive design.
- Integration with trusted government emergency information sources.

## 👩‍💻 Author

**Kaviya B.**

GitHub: [kaviya257](https://github.com/kaviya257)
**Anisha B,**
GitHub:[AnishaBaskaran22](https://github.com/AnishaBaskaran22)

---

*Built to support disaster preparedness and safer emergency planning.*
