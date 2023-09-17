import pandas as pd

# Read the CSV file into a DataFrame
df = pd.read_csv('output.csv')

# Extract the two columns you want
new_df = df[['Name', 'Desc']]

# Save the extracted columns to a new CSV file
new_df.to_csv('output.2.csv', index=False)
