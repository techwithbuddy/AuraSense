import google.generativeai as genai

genai.configure(api_key="AIzaSyCGsXpM8Bk-n3mP65HhdwSIeO0GqRbtnB4")

print("Available models that support generateContent:")
print("=" * 60)
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"Name: {model.name}")
        print(f"Display Name: {model.display_name}")
        print("-" * 60)
