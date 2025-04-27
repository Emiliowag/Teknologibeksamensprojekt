let tasks = [];

function addEntry() {
  const type = document.getElementById('entry-type').value;

  if (type === 'task') {
    const title = document.getElementById('task-title').value;
    const deadline = document.getElementById('task-deadline').value;
    const hours = parseFloat(document.getElementById('task-hours').value);
    if (!title || !deadline || isNaN(hours)) {
        return;
    }
    tasks.push({
      type: 'task',
      title,
      deadline,
      hours,
      spentHours: 0,
      completed: false
    });

  } else if (type === 'activity') {
    const title = document.getElementById('activity-title').value;
    const date = document.getElementById('activity-date').value;
    const start = document.getElementById('activity-start').value;
    const end = document.getElementById('activity-end').value;
    if (!title || !date || !start || !end) {
        return;
    }
    tasks.push({
      type: 'activity',
      title,
      start: `${date}T${start}`,
      end: `${date}T${end}`
    });
  }
  updateCalendar();
  renderTaskList();
}

function updateSpentHours(index, value) {
  const hours = parseFloat(value);
  if (!isNaN(hours)) {
    tasks[index].spentHours = hours;
    updateCalendar();
    renderTaskList();
  }
}

function markCompleted(index) {
  const task = tasks[index];

  tasks = tasks.filter(t => !(t.type === 'activity' && t.generatedForTask === task.title));

  task.completed = true;

  updateCalendar();
  renderTaskList();
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
  renderTaskList();
  addEntry();
  scheduleHomework();
});

function updateCalendar() {
  if (!calendar) return;
  calendar.removeAllEvents();

  tasks.forEach(task => {
    if (task.type === 'task') {
      calendar.addEvent({
        id: task.title + task.deadline,
        title: `${task.title} (${task.hours}t)`,
        start: task.deadline,
        allDay: true,
        color: task.completed ? 'green' : '#4a90e2'
      });
    } else if (task.type === 'activity') {
      calendar.addEvent({
        title: task.title,
        start: task.start,
        end: task.end,
        color: '#e67e22'
      });
    }
  });
}

function openModal(index) {
  const modal = document.getElementById('task-modal');
  const titleEl = document.getElementById('modal-title');
  const inputEl = document.getElementById('modal-hours');
  const leftEl = document.getElementById('modal-hours-left');
  const completeBtn = document.getElementById('modal-complete');

  const task = tasks[index];

  titleEl.textContent = task.title;
  inputEl.value = task.spentHours;
  leftEl.textContent = `Timer tilbage: ${Math.max(0, task.hours - task.spentHours)}`;
  completeBtn.style.display = task.completed ? 'none' : 'inline-block';

  modal.classList.remove('hidden');

  document.getElementById('modal-save').onclick = () => {
    const newHours = parseFloat(inputEl.value);
    if (!isNaN(newHours) && newHours >= 0) {
      task.spentHours = newHours;

      tasks = tasks.filter(t =>
        !(t.type === 'activity' && t.generatedForTask === task.title)
      );
  
      updateCalendar();
      scheduleHomework();
    }
    modal.classList.add('hidden');
  };
  
  document.getElementById('modal-complete').onclick = () => {
    const task = tasks[index];

    tasks = tasks.filter(t => !(t.type === 'activity' && t.generatedForTask === task.title));
  
    task.completed = true;
  
    modal.classList.add('hidden');
  
    updateCalendar();
    renderTaskList();
  };
  

  document.getElementById('modal-close').onclick = () => {
    modal.classList.add('hidden');
  };
}

document.getElementById('entry-type').addEventListener('change', function () {
  const isTask = this.value === 'task';
  document.getElementById('task-fields').style.display = isTask ? 'block' : 'none';
  document.getElementById('activity-fields').style.display = isTask ? 'none' : 'block';
});

function renderTaskList() {
  const listEl = document.getElementById('task-deadlines');
  if (!listEl) {
    return;
  }
  listEl.innerHTML = '';

  const upcomingTasks = tasks
    .filter(t => t.type === 'task' && !t.completed)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  upcomingTasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} - ${task.deadline}`;
    listEl.appendChild(li);
  });
}

function scheduleHomework() {
  tasks = tasks.filter(t => !(t.type === 'activity' && t.generatedForTask));

  function hasActivity(dateStr) {
    return tasks.some(t => 
      t.type === 'activity' &&
      t.start.startsWith(dateStr)
    );
  }

  tasks
    .filter(task => task.type === 'task' && !task.completed)
    .forEach(task => {
      let hoursLeft = task.hours;
      let currentDate = new Date(task.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const studyDays = [];

      while (currentDate >= today) {
        const dateStr = currentDate.toISOString().split('T')[0];

        if (!hasActivity(dateStr)) {
          studyDays.push(new Date(currentDate));
        }

        currentDate.setDate(currentDate.getDate() - 1);
      }

      if (studyDays.length === 0) {
        alert(`Ingen ledige dage til at planlægge lektie for: ${task.title}`);
        return;
      }

      const hoursPerDay = hoursLeft / studyDays.length;

      studyDays.reverse();

      studyDays.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        const start = new Date(`${dateStr}T16:00`);
        const end = new Date(start.getTime() + hoursPerDay * 60 * 60 * 1000);

        tasks.push({
          type: 'activity',
          title: `Lektie: ${task.title}`,
          start: start.toISOString(),
          end: end.toISOString(),
          generatedForTask: task.title
        });
      });
    });

  updateCalendar();
}
