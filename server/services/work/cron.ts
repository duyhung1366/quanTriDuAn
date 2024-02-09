import cron from 'cron';
import TaskMappingService from './task_mapping';

const scanDeadlineTask = new cron.CronJob('0 0 17 * * *', async () => {
    try {
        await TaskMappingService.scanTasksDeadline();
        console.log('Finish scanning task deadline...');
    } catch (err) {
        console.error('Error scanning task deadline: ', err);
    }
});

scanDeadlineTask.start();