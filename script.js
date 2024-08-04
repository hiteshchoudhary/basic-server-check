const grid = document.getElementById('checkbox-grid');
let checkboxes = new Array(100000).fill(false);
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('WebSocket connection opened');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (Array.isArray(data)) {
    checkboxes = data; // Initial state
    renderCheckboxes();
  } else {
    checkboxes[data.index] = data.checked;
    document.getElementById(`checkbox-${data.index}`).checked = data.checked;
  }
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

const handleCheckboxChange = (index) => {
  const newCheckedState = !checkboxes[index];
  checkboxes[index] = newCheckedState;
  ws.send(JSON.stringify({ index, checked: newCheckedState }));
};

const renderCheckboxes = () => {
  grid.innerHTML = ''; // Clear grid
  checkboxes.forEach((checked, index) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${index}`;
    checkbox.className = 'checkbox';
    checkbox.checked = checked;
    checkbox.onchange = () => handleCheckboxChange(index);
    grid.appendChild(checkbox);
  });
};
