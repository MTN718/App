import Onyx from 'react-native-onyx';
import CONST from '../../CONST';
import ONYXKEYS from '../../ONYXKEYS';
import {Inbox_CallUser} from '../API';
import Growl from '../Growl';
import {translateLocal} from '../translate';
import * as Report from './Report';

/**
 * @param {Object} params
 * @param {String} taskID
 * @param {String} policyID
 * @param {String} firstName
 * @param {String} lastName
 * @param {String} phoneNumber
 * @param {String} email
 */
function requestInboxCall({
    taskID, policyID, firstName, lastName, phoneNumber, email,
}) {
    Onyx.merge(ONYXKEYS.REQUEST_CALL_FORM, {loading: true});
    Inbox_CallUser({
        policyID,
        firstName,
        lastName,
        phoneNumber,
        taskID,
    })
        .then((result) => {
            if (result.jsonCode === 200) {
                Growl.success(translateLocal('requestCallPage.growlMessageOnSave'));
                Report.fetchOrCreateChatReport([email, CONST.EMAIL.CONCIERGE], true);
                return;
            }

            // Phone number validation is handled by the API
            Growl.error(result.message, 3000);
        })
        .finally(() => {
            Onyx.merge(ONYXKEYS.REQUEST_CALL_FORM, {loading: false});
        });
}

// eslint-disable-next-line import/prefer-default-export
export {requestInboxCall};
