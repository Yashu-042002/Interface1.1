import sys
import pandas as pd
import re
import json

# Get the file path from command line arguments
file_path = sys.argv[1]

# Read the Excel file
data = pd.read_excel(file_path)

# Process the data
data = data[['Branch', 'Master Enq No', 'Company', 'Sales Person', 'Quote Value', 'Final Quote Value', 'Status', 'History']]
data = data[data['Status'].isin(['New Enquiry', 'Estimate', 'Pending Survey', 'Pending Quotation', 'Follow up'])]

patterns = {
    'Mail Date of Survey': r"(?<=Mail Date of Survey)(.*?)(?=Person Doing Survey)",
    'Actual Survey Done': r"(?<=Actual Survey Done)(.*?)(?=Survey Done By)",
    'Estimation Date': r"(?<=Estimation Date)(.*?)(?=Estimation Amount)",
    'Estimation Amount': r"(?<=Estimation Amount)(.*?)(?=CFT)",
    'Quotation Ref & Date': r"(?<=Quotation Ref & Date)(.*?)(?=Quotation Value & Submission Date)",
    'Quotation Value & Submission Date': r"(?<=Quotation Value & Submission Date)(.*?)(?=HH:MM)",
    'Date of Next Contact': r"(?<=Date of Next Contact)(.*?)(?=Next action|$)",
    'Next action': r"(?<=Next action)(.*?)(?=Date of Next Contact|$)"
}

def extract_information(row, patterns):
    extracted_data = {}
    for key, pattern in patterns.items():
        match = re.findall(pattern, row['History'])
        if match:
            cleaned_matches = [m.strip().lstrip(":").strip() for m in match]
            extracted_data[key] = cleaned_matches
        else:
            extracted_data[key] = []
    return extracted_data

result = {}
id_counter = 1  # Initialize the ID counter

for index, row in data.iterrows():
    extracted_info = extract_information(row, patterns)
    master_enq_no = row['Master Enq No']

    # Create a detailed entry for each Master Enq No with a unique ID
    result[master_enq_no] = {
        'ID': id_counter,  # Assign the unique integer ID
        'Branch': row['Branch'],
        'Company': row['Company'],
        'Sales Person': row['Sales Person'],
        'Quote Value': row['Quote Value'],
        'Final Quote Value': row['Final Quote Value'],
        'Status': row['Status'],
        'Mail Date of Survey': extracted_info.get('Mail Date of Survey', []),
        'Actual Survey Done': extracted_info.get('Actual Survey Done', []),
        'Estimation Date': extracted_info.get('Estimation Date', []),
        'Estimation Amount': extracted_info.get('Estimation Amount', []),
        'Quotation Ref & Date': extracted_info.get('Quotation Ref & Date', []),
        'Quotation Value & Submission Date': extracted_info.get('Quotation Value & Submission Date', []),
        'Date of Next Contact': extracted_info.get('Date of Next Contact', []),
        'Next action': extracted_info.get('Next action', [])
    }
    
    id_counter += 1  # Increment the ID counter

# Print result as JSON
print(json.dumps(result, indent=2))
