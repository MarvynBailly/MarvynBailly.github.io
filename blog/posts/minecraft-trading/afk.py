import pyautogui
import time
import keyboard
import random

def main():
    elements = ['a', 'w', 's', 'd']
    print("Press 'Alt + Q' to stop the script.")
    # Wait for 3 seconds before starting
    time.sleep(3)
    while True:        
        if keyboard.is_pressed('alt') and keyboard.is_pressed('q'):
            print("Stopping the script.")
            break
        
        pyautogui.mouseDown(button='right')
        random_choice = random.choice(elements)
        pyautogui.keyDown(random_choice)
        time.sleep(random.uniform(0.5, 2))
        pyautogui.keyUp(random_choice)        
        time.sleep(random.uniform(0.5, 2))
    
    pyautogui.mouseUp(button='right')
    
    
    
if __name__ == "__main__":
    main()