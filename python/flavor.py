import requests
from bs4 import BeautifulSoup

keywords = ["sweet", "sour", "bitter", "salty", "umami"]
flavor_count = {key: 0 for key in keywords}

url = 'https://cosylab.iiitd.edu.in/flavordb2/entity_details?id=387' #eggplant link
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

#print(soup)
with open('output.html', 'w', encoding='utf-8') as file:
    file.write(soup.prettify())

table = soup.find('table', {'id': 'molecules'})
rows = table.find_all('tr')
print(rows)

for row in rows:
    row_text = row.text.lower() 
    for keyword in keywords:
        flavor_count[keyword] += row_text.count(keyword)

# Виводимо результат
print(flavor_count)

#with open('rows.txt', 'w', encoding='utf-8') as file:
#    for row in rows:
#        file.write(row.text.strip() + '\n')
#for row in rows:
#    taste_cell = row.find_all('td')
#    print(taste_cell.text.strip())