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

  scheduleHomework();
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
        title: `${task.title} (${task.hours}t)`,
        start: task.deadline,
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
    task.completed = true;
    modal.classList.add('hidden');
    updateCalendar();
    renderTaskList();
    addEntry();
    scheduleHomework();
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
  const incompleteTitles = tasks
  .filter(t => t.type === 'task' && !t.completed)
  .map(t => t.title);

    tasks = tasks.filter(t => !(t.type === 'activity' && incompleteTitles.includes(t.generatedForTask)));


  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const dailySchoolStart = 8;
  const dailySchoolEnd = 15.5;
  const sleepTime = 22;

  const getDateString = (date) => date.toISOString().split('T')[0];

  tasks
    .filter(task => task.type === 'task' && !task.completed)
    .forEach(task => {
      const deadline = new Date(task.deadline);
      const days = [];

      for (let d = new Date(); d <= deadline; d.setDate(d.getDate() + 1)) {
        const dateStr = getDateString(d);
        const dayStart = new Date(`${dateStr}T00:00`);
        const lektieStart = new Date(`${dateStr}T15:30`);
        const lektieEnd = new Date(`${dateStr}T${sleepTime < 10 ? '0' : ''}${sleepTime}:00`);

        const dailyBlocks = tasks
          .filter(t => t.type === 'activity' &&
            new Date(t.start).toDateString() === d.toDateString())
          .map(t => ({
            start: new Date(t.start),
            end: new Date(t.end)
          }));

        dailyBlocks.push({
          start: new Date(`${dateStr}T08:00`),
          end: new Date(`${dateStr}T15:30`)
        });

        dailyBlocks.sort((a, b) => a.start - b.start);

        const freeSlots = [];
        let cursor = lektieStart;

        for (const block of dailyBlocks) {
          if (block.start > cursor && cursor < lektieEnd) {
            freeSlots.push({
              start: new Date(cursor),
              end: new Date(Math.min(block.start, lektieEnd))
            });
          }
          if (block.end > cursor) {
            cursor = new Date(Math.max(cursor, block.end));
          }
        }

        if (cursor < lektieEnd) {
          freeSlots.push({
            start: new Date(cursor),
            end: lektieEnd
          });
        }

        const availableMinutes = freeSlots.reduce((sum, slot) => {
          return sum + (slot.end - slot.start) / (1000 * 60);
        }, 0);

        days.push({ date: new Date(d), freeSlots, availableMinutes });
      }

      const totalMinutesNeeded = task.hours * 60;
      const totalFree = days.reduce((sum, d) => sum + d.availableMinutes, 0);

      if (totalFree < totalMinutesNeeded) {
        alert(`Ikke nok tid til opgaven: ${task.title}`);
        return;
      }

      let remaining = totalMinutesNeeded;

      days.forEach(day => {
        if (remaining <= 0) return;
        const fraction = day.availableMinutes / totalFree;
        let toAssign = Math.min(remaining, Math.round(totalMinutesNeeded * fraction));

        for (const slot of day.freeSlots) {
          if (toAssign <= 0) break;
          const slotMinutes = (slot.end - slot.start) / (1000 * 60);
          const used = Math.min(slotMinutes, toAssign);

          if (used >= 15) {
            const start = new Date(slot.start);
            const end = new Date(start.getTime() + used * 60 * 1000);

            tasks.push({
              type: 'activity',
              title: `Lektie: ${task.title}`,
              start: start.toISOString(),
              end: end.toISOString(),
              generatedForTask: task.title
            });

            toAssign -= used;
            remaining -= used;
          }
        }
      });
    });

  updateCalendar();
}
