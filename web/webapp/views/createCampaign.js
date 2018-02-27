const onLoad = (() => {
    var tasks = [];
    
    const addTask = () => {
        const task = {
            title: document.getElementById('new-task-title').value,
            context: document.getElementById('new-task-context').value,
            choices: document.getElementById('new-task-choices').value,
            keywords: document.getElementById('new-task-keywords').value,
            workersPerTask: document.getElementById('new-task-workers-per-task').value,
            majorityThreshold: document.getElementById('new-task-majority-threshold').value
        };
        console.log(task);
        tasks.push(task);
    };

    const createCampaign = () => {
        const campaignName = document.getElementById('campaign-name').value;
        const campaign = {
            name: campaignName,
            tasks: tasks
        };
        console.log(campaign);
        window.alert('createCampaign NOT IMPLEMENTED') // TODO
        window.location.replace('requester-campaigns.html');
    };

    const init = () => {
        const addTaskButton = document.getElementById('add-task-button');
        addTaskButton.onclick = addTask;
        const createCampaignButton = document.getElementById('create-campaign-button');
        createCampaignButton.onclick = createCampaign;
    };

    return init;
})();

document.addEventListener('DOMContentLoaded', onLoad, false);