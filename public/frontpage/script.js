let tasks = [];

function addTask() {
    const title = document.getElementById('title').value;
    const hours = parseFloat(document.getElementById('hours').value);
    const deadline = document.getElementById('deadline').value;

    if (!title || isNaN(hours) || !deadline) {
        alert("Udfyld alle felter.");
        return;
    }

    const task = {
        title,
        hours,
        deadline,
        spentHours: 0,
        completed: false
    };

    tasks.push(task);
    renderTasks();
    updateCalendar();
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';


    tasks.forEach((task, index) => {
        const div = document.createElement('div');
        div.className = 'task';
        div.id = "task"
        div.innerHTML = `
      <strong>${task.title}</strong><br>
      Deadline: ${task.deadline}<br>
      Timer tilbage: ${task.hours - task.spentHours}<br>
      <button onclick="markCompleted(${index})">${task.completed ? 'Afleveret' : 'Markér som afleveret'}</button>
      ${task.completed 
        ? '<em>færdig</em>' 
        : `<input type="number" value="${task.spentHours}" oninput="updateSpentHours(${index}, this.value)">`}
    `;
        list.appendChild(div);
    });
}

function updateSpentHours(index, value) {
    const hours = parseFloat(value);
    if (!isNaN(hours)) {
        tasks[index].spentHours = hours;
        renderTasks();
        updateCalendar();
    }
}

function markCompleted(index) {
    tasks[index].completed = !tasks[index].completed;

    renderTasks();
    updateCalendar();
}

let calendar;

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar-view');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'da',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listWeek'
    },
    events: [],
    eventClick: function(info) {
        const taskTitle = info.event.title.split(' (')[0];
        const taskIndex = tasks.findIndex(t => t.title === taskTitle && t.deadline === info.event.startStr);
        if (taskIndex === -1) return;
    
        openModal(taskIndex);
      }
  });
  calendar.render();
});

function updateCalendar() {
  calendar.removeAllEvents();
  tasks.forEach(task => {
    calendar.addEvent({
      title: `${task.title} (${task.hours}t)`,
      start: task.deadline,
      color: task.completed ? 'green' : '#4a90e2'
    });
  });
}

function openModal(index) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalInput = document.getElementById('modal-hours');
  
    modalTitle.textContent = tasks[index].title;
    modalInput.value = tasks[index].spentHours;
    modal.classList.remove('hidden');
  
    document.getElementById('modal-save').onclick = () => {
      const newHours = parseFloat(modalInput.value);
      if (!isNaN(newHours) && newHours >= 0) {
        tasks[index].spentHours = newHours;
        renderTasks();
        updateCalendar();
      }
      modal.classList.add('hidden');
    };
  
    document.getElementById('modal-close').onclick = () => {
      modal.classList.add('hidden');
    };
  }
  