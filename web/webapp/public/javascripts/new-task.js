 window.onload = () => {
     const tasks = [];

     const renderTasks = () => {
         const taskTemplate = document.getElementById('task-template').cloneNode(true);
         taskTemplate.getElementByClassName('task-title')[0].innerText
         //TODO
         taskTemplate.hidden = false;
     };

     document.getElementById('add-task').onclick = () => {
         tasks.push({
             title: tasks.document.getElementById('new-title').value
             context: tasks.document.getElementById('new-context').value
             coices: tasks.document.getElementById('new-choices').value
             keywords: tasks.document.getElementById('new-keywords').value
         });
         renderTasks();
     };
};
