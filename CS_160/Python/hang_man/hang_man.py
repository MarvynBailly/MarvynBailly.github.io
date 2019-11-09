"""
  Hangman Game
  Auther: Marvyn Bailly
  Version: 0.01
  Play Hangman
"""

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

def pc_difficulty():
  """
  Lets the user choice the difficulty of the pc
  input: nothing
  output: difficulty level
  """
  print("What difficulty would you like to play on?")
  difficulty = input("E for easy, M for medium, and H for hard: " )
  return difficulty

def human_create_puzzle():
  """
  Friend creates puzzle
  """
  puzzle = input("Friend, please enter the puzzle: " )
  return puzzle

def user_progress(puzzle):
  progress = "_ " * len(puzzle)
  return progress

def pc_create_puzzle(difficulty):
  """
  Creates a puzzle for the user to guess
  picks out of random words based on difficulty

  """
  return "puzzle"

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
  evaluation = []
  progress = progress.replace(" ","")
  
  for i in evaluation:
    progress = progress.replace([i],guess)

  for i in range(len(puzzle)):
    if guess == puzzle[i]:
      evaluation.append(i)

  
  progress = " ".join(progress)
  print(progress)

#def show_guess_results(evaluation,progress,guess):
#  """
#  expressses the results
#  input: evaluation
#  output: results
#  """
#  progress = progress.replace(" ","")
#  
#  for i in evaluation:
#    progress = progress.replace([i],guess)
#
#  progress = " ".join(progress)
#  print(progress)

def one_round(opponent, difficulty):
  """
  Play one round
  Ends after 6 rounds or user wins
  input: opponent, difficulty
  output: win xor lose
  """
  if opponent in ["C", "c","computer"]:
    puzzle = pc_create_puzzle(difficulty)
  else:
    puzzle = human_create_puzzle()
  
  progress = user_progress(puzzle)
  guess = get_user_guess()
  evaluation = evaluate_user_guess(puzzle, guess,progress)
  #show_guess_results(evaluation,progress,guess)

#https://repl.it/@marvynb/Hang-Man
def game_loop():
  """
  calls the welcome
  gives option for rules and options
  """
  welcome()
  rules()
  wants_to_play = input("What to play? (y/n) ")

  while wants_to_play in ['y','Y','Yes','yes',"YES","YES!"]:
    difficulty = ""

    opponent = user_opponent()
    if opponent in ["C", "c","computer"]:
      difficulty = pc_difficulty()
    one_round(opponent, difficulty)

    wants_to_play = input("What to play again? (y/n) ")

game_loop()
