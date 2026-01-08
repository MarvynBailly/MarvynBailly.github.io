import pandas



def addEntry(Start,End,Direction):
    #read data from file 
    data = pandas.read_csv("test.csv",index_col=0)
    data = data.to_dict()
    
    l = len(data["Start"])

    data["Start"][l + 1] = Start
    data["End"][l + 1] = End
    data["Direction"][l + 1] = Direction

    df = pandas.DataFrame(data)
    
    df.to_csv("test.csv", index="False", header="False")


addEntry(1,10,"Left")