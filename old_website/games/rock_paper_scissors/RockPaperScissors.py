import random 

RPS = ["rock","paper","scissor"]

def defChoice():
    choice = input("What you like to play rock, paper, or scissor? \n",)
    if choice == "Rock" or choice == "rock" or choice == "R" or choice == "r" or choice == 1:
        return RPS[0]
    elif choice == "Paper" or choice == "paper" or choice == "P" or choice == "p" or choice == 2:
        return RPS[1]
    elif choice == "Scissor" or choice == "scissor" or choice == "s" or choice == "S" or choice == 3:
        return RPS[2]

def defComputer():
    return random.choice(RPS)

def game(playerchoice, computerchoice):
    if playerchoice == computerchoice:
        return "you tie"
    elif playerchoice == "rock" and computerchoice == "scissor" or playerchoice == "scissor" and computerchoice == "paper" or playerchoice == "paper" and computerchoice == "scissor":
        return "you win"
    else:
        return "you lose"

def main():
    print("Welcome to Rock Paper Scissor!")
    while True:
        playerchoice = defChoice() 
        computerchoice = defComputer()
        result = game(playerchoice, computerchoice)
        print("You played:",playerchoice,"\nThe computer played:",computerchoice,"\nResult:",result,"\nWould you like to (q)uit or (c)ontinue?")
        end = input() 
        if end == "Quit" or end == "quit" or end == "Q" or end == "q":
            break

main()