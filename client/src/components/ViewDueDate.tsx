import moment from 'moment';
import { TaskStatus } from '../../../common/constants';

interface DateProps {
    date: number;
    status: number;
}

export const FormattedDate = (props: DateProps) => {
    const date = props.date
    const status = props.status
    const inputDate = moment(date);
    const now = moment();
    const startNow = moment().startOf('day');
    const midNight = moment().endOf('day');
    let dateString = inputDate.format('MMM D');
    const diffDays = inputDate.diff(now, 'days');
    const diffMinutes = inputDate.diff(now, 'minutes');
    const durationNowToTomorow = moment.duration(midNight.diff(now));
    const remainingNTTMinutes = durationNowToTomorow.asMinutes();
    const durationYesterdayToNow = moment.duration(now.diff(startNow));
    const remainingYTNMinutes = durationYesterdayToNow.asMinutes();

    const durationNowToDeadline = moment.duration(inputDate.diff(now));
    const remainingNowToDeadline = durationNowToDeadline.asMinutes();

    const checkDeadline = (() => {
        if (status === TaskStatus.COMPLETE) {
            return true
        }
        return false
    })
    if (date) {
        if (diffDays === -1 && diffMinutes >= -remainingYTNMinutes - 1440 || diffDays === 0 && diffMinutes < -remainingYTNMinutes) {
            return <div style={
                checkDeadline()
                    ? { color: '#343434' }
                    : { color: '#F94343' }
            }> {dateString = 'Yesterday'}</div>
        } else if (diffDays === 0 && diffMinutes <= remainingNTTMinutes && diffMinutes >= -remainingYTNMinutes) {
            return <div
                style={
                    checkDeadline()
                        ? { color: '#343434' }
                        : remainingNowToDeadline < 0
                            ? { color: '#F94343' }
                            : { color: "#FFAE18" }
                }
            >
                {dateString = 'Today'}
            </div>
        } else if (diffDays === 0 && diffMinutes > remainingNTTMinutes || diffDays === 1 && diffMinutes <= remainingNTTMinutes + 1440) {
            return <div >{dateString = 'Tomorrow'}</div>
        } else {
            return <div style={
                checkDeadline() || remainingNowToDeadline > 0
                    ? { color: "#343434" }
                    : { color: "#F94343" }
            }>{dateString}</div>;
        }
    } else {
        return null;
    }
};


