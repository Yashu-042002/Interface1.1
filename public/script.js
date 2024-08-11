document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      displayResult(result);
    } catch (error) {
      console.error('Error:', error);
    }
  });
  
  function displayResult(result) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<h2>Processed Data:</h2>';
    
    if (Object.keys(result).length === 0) {
      resultDiv.innerHTML += '<p>No data available.</p>';
      return;
    }
  
    let tableHtml = '<table><thead><tr><th>Master Enq No</th><th>Details</th></tr></thead><tbody>';
  
    for (const [key, value] of Object.entries(result)) {
      tableHtml += `<tr><td><a href="/details/${encodeURIComponent(key)}">${key}</a></td><td>Click to view details</td></tr>`;
    }
  
    tableHtml += '</tbody></table>';
    resultDiv.innerHTML += tableHtml;
  }
  