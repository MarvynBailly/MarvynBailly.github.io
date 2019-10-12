from time import sleep
import os

gas= int(input("How much gas do you have?",))

def cls():
    os.system('cls' if os.name=='nt' else 'clear')

for i in range(gas):
    cls()
    print("     __________ \n    //   |||   \\         \n __//____|||____\\____   \n| _|      |       _  ||\n|/ \______|______/ \_|| \n_\_/_____________\_/_______\n")
    sleep(1)