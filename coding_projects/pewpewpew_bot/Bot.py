from pyautogui import *
import pyautogui
import time
import keyboard
import random
import win32api, win32con

#https://gameforge.com/en-US/littlegames/magic-piano-tiles/
#Tile 1: X: 1261 Y:  655 RGB: (  0,   0,   0)
#Tile 2: X: 1353 Y:  655 RGB: (  0,   0,   0)
#Tile 3: X: 1476 Y:  655 RGB: (  0,   0,   0)
#Tile 4: X: 1587 Y:  655 RGB: (  0,   0,   0)

def click(x,y):
    win32api.SetCursorPos((x,y))
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN,0,0)
    time.sleep(0.1)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP,0,0)
    
while keyboard.is_pressed('q') == False:
    
    if pyautogui.pixel(1492,420)[0] == 1:
        click(1492,420)
    if pyautogui.pixel(1566,420)[0] == 1:
        click(1566,420)
    if pyautogui.pixel(1646,420)[0] == 1:
        click(1646,420)
    if pyautogui.pixel(1728,420)[0] == 1:
        click(1728,420)