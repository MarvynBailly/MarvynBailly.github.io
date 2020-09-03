
def listToString(s):   
    str1 = ""  
    for ele in s:  
        str1 += ele   
    
    return str1  

def find_emoji(word):
  while word.find("\\u") != -1:
    emoji_location = word.find('\\u')
    word_list = list(word)
    word_list[emoji_location-1:emoji_location+6] = ''
    word = listToString(word_list)
  return(word)

def load_friends():
  with open('friends.txt','r') as friendsFile:
    friendsData = str(friendsFile.readlines())
  friendsList = friendsData.split('}')
  #Removing the text
  friendsList[0] = friendsList[0][13:len(str(friendsList[0]))]
  return friendsList

def org_friends(friendsList):
  for friend in friendsList:
    org_friend = friend[4:len(friend)].replace('"','')
    org_friend = find_emoji(org_friend) 
    with open('friends_org.txt','a') as orgFriendsData:
      orgFriendsData.write(org_friend+"\n")

def clear_friends():
  open('friends_org.txt', 'w').close()

def friendLoop():
  clear_friends()
  friendsList = load_friends()
  org_friends(friendsList)


friendLoop()
