
import json
import os

import requests

res = []
for file_path in os.listdir("./"):
    # check if current file_path is a file
    if os.path.isfile(os.path.join("./", file_path)):
        # add filename to list
        res.append(file_path)
print(res)

# f = open("players.json", encoding="utf8")
# players = json.load(f)

# for player in players:
#     # print(player['player'])
#     img_data = requests.get(player['player']['photo']).content
#     with open(f"../../static/{player['player']['id']}.png", "wb") as f:
#         f.write(img_data)

f = open("./teams.json", encoding="utf8")
teams = json.load(f)

for team in teams:
    print(team['logo'])
    img_data = requests.get(team['logo']).content
    with open(f"../../static/badges/{team['externalId']}.png", "wb") as f:
        f.write(img_data)