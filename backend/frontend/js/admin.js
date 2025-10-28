// Replace any mock data with actual API calls
async function loadComplaints() {
  try {
      const response = await fetch('/api/complaints');
      const result = await response.json();
      
      if (result.success) {
          // Display the complaints in your table
          displayComplaints(result.complaints);
      }
  } catch (error) {
      console.error('Error loading complaints:', error);
  }
}

async function updateComplaintStatus(refNumber, status) {
  try {
      const response = await fetch(`/api/complaints/${refNumber}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status })
      });
      
      const result = await response.json();
      if (result.success) {
          loadComplaints(); // Refresh the list
      }
  } catch (error) {
      console.error('Error updating status:', error);
  }
}