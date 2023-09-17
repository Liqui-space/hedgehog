import requests
from lxml import html
import csv

def get_data(url):
    response = requests.get(url)
    tree = html.fromstring(response.content)

    selectors = [
        '#__next > div > main > div.sc-a0f745da-0.dNNyaq > div.sc-63649c2d-0.sc-32fdeb4-3.ivknjy.jMYHKM > details > summary > span:nth-child(2) > span:nth-child(2)',
        '#__next > div > main > div:nth-child(4) > div:nth-child(1) > p:nth-child(2)',
        '#__next > div > main > div:nth-child(4) > div:nth-child(1) > div > a:nth-child(1)',
        '#__next > div > main > div:nth-child(4) > div:nth-child(1) > div > a:nth-child(2)'
    ]

    data = []

    for selector in selectors:
        element = tree.cssselect(selector)
        if element:
            if element[0].tag == 'a':
                data.append(element[0].get('href'))
            else:
                data.append(element[0].text_content())
        else:
            data.append('Not found')

    return data

# Read the list.csv file
with open('list.csv', 'r', newline='') as input_file:
    reader = csv.reader(input_file)
    next(reader)  # Skip the header row

    # Prepare the output CSV file
    with open('output.csv', 'w', newline='') as output_file:
        writer = csv.writer(output_file)
        writer.writerow(['Name', 'URL', 'MAX TVL', 'Desc', 'Website', 'Twitter'])  # Write the header row

        # Loop through the URLs and save the results to the output CSV
        for row in reader:
            name, url = row
            print(f"Processing {name} ({url})")
            result = get_data(url)
            writer.writerow([name, url, *result])

print("Scraping and saving completed.")
