def load_friend_data():
    "Loads the users friends"
    friends = []
    path = r"C:\Users\admin\Desktop\Snapchat\json\friends.json"
    
    with open(path) as f:
        for line in f:
            for word in line.split():
              friends.append(word)
    print(friends)
    
    print("Loading friend data")

def load_chat_data():
    "Loads chat"
    print("Loading chat data")

def chat():
    "Gives data regarding chat"
    "Incoming messages stats"
    "Outgoing message stats"
    "Bar graph"
    load_chat_data()
    print("chata data")

def friends():
    "Gives data regarding friends"
    load_friend_data()
    print("friend data")

def options():
    "asks users what the would like to do"
    choice = input("Would you like to know about your [f]riends or your [m]essages? ",)
    if choice == "f":
        friends()
    else:
        chat()

def welcome():
    "welcomes the users"
    
    wants_to_know = input("Welcome user, would you like to use the program? ",)
    while wants_to_know in ("Yes","yes"):
        options()
        wants_to_know = input("Would you like to use the program again? ",)

welcome()
