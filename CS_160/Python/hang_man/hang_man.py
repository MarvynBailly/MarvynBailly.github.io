"""
  Hangman Game
  Auther: Marvyn Bailly
  Version: 0.02
  Play Hangman
""" 
from os import system, name 
import random

def loadWords():
  words = []
  with open('words.txt','r') as f:
    for line in f:
        for word in line.split():
          words.append(word)
  return words

def chooseWord(words):
  """
  words (list): list of words (strings)
  Returns a word from words at random
  """
  return random.choice(words)

def load_hangman(number):
  with open("hangman.txt", "r") as f:
    searchlines = f.readlines()
  for i, line in enumerate(searchlines):
    if number in line: 
      for l in searchlines[i+1:i+11]: 
        print(l,end = '')


def clear(): 
    if name == 'nt': 
        _ = system('cls') 
    else: 
        _ = system('clear') 
   
def welcome():
  """
  Welcomes the player to the game
  input: nothing
  output: nothing
  """
  print("Welcome to hangman!")

def rules():
  """
  States the rules of hangman
  input: nothing
  output: nothing 
  """
  print("Guess a random word created by a freind or the computer")
  print("You have 6 guesses before you lose")
  print("Letters that are correctly guessed will be shown in their place")
  
def user_opponent():
  """
  Lets the user choice if they play against the pc or a friend
  input:nothing
  output:pc or friend
  """
  print("Would you like to play against a friend or the computer?")
  opponent = input("Please enter H for human and C for computer:" )
  return opponent

def human_create_puzzle():
  """
  Friend creates puzzle
  """
  puzzle = input("Friend, please enter the puzzle: " )
  clear()
  return puzzle

def user_progress(puzzle):
  progress = "_ " * len(puzzle)
  return progress

def pc_create_puzzle():
  """
  Creates a puzzle for the user to guess

  """
  words = loadWords()
  puzzle = chooseWord (words).lower()
  clear()
  return puzzle

def get_user_guess():
  """
  User guesses a letter
  ignores caps and checks for numbers
  input: nothing
  output: user guess
  """
  guess = input("Please enter the letter you want to guess: " ) 
  "add a letter check later"
  return guess

def evaluate_user_guess(puzzle, guess, progress):
  """
  Checks the user's with the puzzle
  Input: puzzle and user's guess
  Output: Evaluation
  """
  progress = list(progress.replace(" ",""))

  for i in range(len(puzzle)):
    if guess == puzzle[i]:
      del progress[i]
      progress.insert(i,guess)

  progress = " ".join(progress)
  return progress

def create_puzzle(opponent):
  if opponent in ["C", "c","computer"]:
    puzzle = pc_create_puzzle()
  else:
    puzzle = human_create_puzzle()
  return puzzle

def check_guess(guess,puzzle):
  if guess in puzzle:
    return True
  else:
    return False

def print_results(number,puzzle,result):
  load_hangman(number)
  if result == "win":
    print("\n"+"You guessed the word! The word was:", puzzle)
    print("You Win!") 
  else:
    print("\n"+"You didn't guess the word. The word was:",puzzle)
    print("You Lose!")

def one_round(opponent):
  """
  Play one round
  Ends after 6 rounds or user wins
  input: opponent
  output: win xor lose
  """
  correct_answer = False
  missed_rounds = 0
  letters_guessed = []

  puzzle = create_puzzle(opponent)
  progress = user_progress(puzzle)

  while missed_rounds != 6:
    if correct_answer == False:
      load_hangman(str(missed_rounds))
      print("\n",progress)
      print("Letters guessed:", " ".join(letters_guessed))
      guess = get_user_guess()
      if check_guess(guess,puzzle) == True:
        progress = evaluate_user_guess(puzzle, guess,progress)
      else:
        letters_guessed.append(guess)
        print(guess, "is not in the word")
        missed_rounds += 1

      correct_answer = (progress.replace(" ","") == puzzle)
      input("press enter to continue",)
      clear()
    else:
      print_results(str(missed_rounds),puzzle,result="win")
      return
  print_results(str(missed_rounds),puzzle,result="lose")
  return 

def game_loop():
  """
  calls the welcome
  gives option for rules and options
  """
  welcome()
  rules()
  wants_to_play = input("What to play? (y/n) ")

  while wants_to_play in ['y','Y','Yes','yes',"YES","YES!"]:

    opponent = user_opponent()
    one_round(opponent)
    
    wants_to_play = input("What to play again? (y/n) ")

game_loop()