import streamlit as st
import google.generativeai as genai
from PIL import Image
from gtts import gTTS
import base64
import os

# 1. Configuration
genai.configure(api_key="AIzaSyCGsXpM8Bk-n3mP65HhdwSIeO0GqRbtnB4")
model = genai.GenerativeModel('gemini-2.5-flash')

def speak_text(text):
    """Function to convert text to speech and play it automatically"""
    tts = gTTS(text=text, lang='en')
    tts.save("temp.mp3")
    with open("temp.mp3", "rb") as f:
        data = f.read()
        b64 = base64.b64encode(data).decode()
        # This hidden HTML snippet forces the browser to play the audio
        md = f"""
            <audio autoplay="true">
            <source src="data:audio/mp3;base64,{b64}" type="audio/mp3">
            </audio>
            """
        st.markdown(md, unsafe_allow_html=True)

# --------- STREAMLIT PAGE CONFIG ----------
st.set_page_config(
    page_title="Voice Vision",
    page_icon="👁️",
    layout="centered"
)

# --------- GEMINI CONFIG ----------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")


# --------- CUSTOM ACCESSIBLE FRONTEND ----------
st.markdown("""
<style>
body {
    background-color: #000000;
}
.big-title {
    font-size: 48px;
    font-weight: bold;
    color: #FFD700;
    text-align: center;
}
.subtitle {
    font-size: 22px;
    color: #FFFFFF;
    text-align: center;
}
.scan-box {
    border: 3px dashed #FFD700;
    padding: 30px;
    border-radius: 20px;
    margin-top: 30px;
    text-align: center;
}
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="big-title">👁️ Voice Vision</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">See the world through sound</div>', unsafe_allow_html=True)




# 2. UI Layout
st.title("👁️ Voice Vision")
st.write("Take a photo to hear what is in front of you.")

img = st.camera_input("Scan environment")

if "welcome" not in st.session_state:
    speak_text("Welcome to Voice Vision. Tap the scan button to hear your surroundings.")
    st.session_state["welcome"] = True

if img:
    image = Image.open(img)

    with st.spinner("Analyzing surroundings"):
        prompt = (
            "You are an assistant for a visually impaired person. "
            "Describe the scene in one or two short, clear sentences."
        )
        response = model.generate_content([prompt, image])
        description = response.text

    st.markdown("## 🔊 What I See")
    st.markdown(
        f"<div style='font-size:26px; color:white;'>{description}</div>",
        unsafe_allow_html=True
    )

    speak_text(description)







