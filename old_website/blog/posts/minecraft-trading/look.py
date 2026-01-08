import pyautogui
import time
import keyboard
import cv2
import numpy as np


def on_key_release(event):
    if event.name == "p":
        current_mouse_position = pyautogui.position()
        print(f"Current mouse position: {current_mouse_position}")
    

    
    if event.name == "r":
        y_pos = 590
        x_pos = 880
        for i in range(5):
            #move to the string
            pyautogui.moveTo(x=x_pos, y=y_pos)
            pyautogui.click()
            
            #move to the trade slot
            pyautogui.moveTo(x=990, y=390)
            pyautogui.click()
            
            #get emeralds
            pyautogui.keyDown("shift")
            pyautogui.moveTo(x=1320, y=400) 
            pyautogui.click()
            
            pyautogui.moveTo(x=990, y=390)
            pyautogui.click()
             
            pyautogui.keyUp("shift")
            
            x_pos += 65
        
        
        
        
        

def main():
    screen_width, screen_height = pyautogui.size()
    print("In main loop")
    
    # Add event listener for key releases
    keyboard.on_release(on_key_release)
    
    while True:
        if keyboard.is_pressed('q'):
            print("exiting")
            break
        
        if keyboard.is_pressed("g"):
                print("center")
                x =screen_width/2
                y = screen_height/2
                pyautogui.moveTo(x, y, duration=.1)
    
    
    
if __name__ == "__main__":
    main()
