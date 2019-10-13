from time import sleep
import os

def cls():
    os.system('cls' if os.name=='nt' else 'clear')

message = 'hello'
for i in range(len(message), 0, -1):
    cls()
    print(message[:i])
    sleep(1)

    from time import sleep
import os


length = "_______________________________________________________________________________________________________________"
gas= int(input("How much gas do you have?",))
tree = "      /\      \n     /\/\     \n    /\/\/\    \n   /\/\/\/\   \n  /\/\/\/\/\  \n /\/\/\/\/\/\ \n/\/\/\/\/\/\/\ \n      ||      \n      ||      \n      ||      \n"
car = "     __________ \n    //   |||   \\         \n __//____|||____\\____   \n| _|      |       _  |\n|/ \______|______/ \_| \n_\_/_____________\_/____________________________________________________________________________________ \n" + length

scene = tree + car

#length - 7

def cls():
    os.system('cls' if os.name=='nt' else 'clear')

for i in range(gas):
    cls()
    print(scene)
    sleep(1)