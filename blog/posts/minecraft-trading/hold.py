import pyautogui
import time
import keyboard

def main():
    print("Press 'Alt + Q' to stop the script.")
    # Wait for 3 seconds before starting
    time.sleep(3)
    while True:
        if keyboard.is_pressed('alt') and keyboard.is_pressed('q'):
            print("Stopping the script.")
            break
        pyautogui.mouseDown(button='left')
    pyautogui.mouseUp(button='left')        
    
    
    
    
if __name__ == "__main__":
    main()
