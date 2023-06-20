
import json

import requests


f = open("players.json", encoding="utf8")
players = json.load(f)

for player in players:
    # print(player['player'])
    img_data = requests.get(player['player']['photo']).content
    with open(f"../../static/{player['player']['id']}.png", "wb") as f:
        f.write(img_data)