import _ from 'underscore';
import lodashGet from 'lodash/get';
import Str from 'expensify-common/lib/str';
import {
    Clipboard as ClipboardIcon, LinkCopy, Mail, Pencil, Trashcan, Checkmark,
} from '../../../../components/Icon/Expensicons';
import {
    setNewMarkerPosition, updateLastReadActionID, saveReportActionDraft,
} from '../../../../libs/actions/Report';
import Clipboard from '../../../../libs/Clipboard';
import {isReportMessageAttachment, canEditReportAction, canDeleteReportAction} from '../../../../libs/reportUtils';
import ReportActionComposeFocusManager from '../../../../libs/ReportActionComposeFocusManager';
import {hideContextMenu, showDeleteModal} from './ReportActionContextMenu';

/**
 * Gets the HTML version of the message in an action.
 * @param {Object} reportAction
 * @return {String}
 */
function getActionText(reportAction) {
    const message = _.last(lodashGet(reportAction, 'message', null));
    return lodashGet(message, 'html', '');
}

const CONTEXT_MENU_TYPES = {
    LINK: 'LINK',
    REPORT_ACTION: 'REPORT_ACTION',
};

// A list of all the context actions in this menu.
export default [
    {
        textTranslateKey: 'reportActionContextMenu.copyURLToClipboard',
        icon: ClipboardIcon,
        successTextTranslateKey: 'reportActionContextMenu.copied',
        successIcon: Checkmark,
        shouldShow: type => type === CONTEXT_MENU_TYPES.LINK,
        onPress: (closePopover, {selection}) => {
            Clipboard.setString(selection);
            hideContextMenu(true, ReportActionComposeFocusManager.focus);
        },
    },
    {
        textTranslateKey: 'reportActionContextMenu.copyToClipboard',
        icon: ClipboardIcon,
        successTextTranslateKey: 'reportActionContextMenu.copied',
        successIcon: Checkmark,
        shouldShow: type => type === CONTEXT_MENU_TYPES.REPORT_ACTION,

        // If return value is true, we switch the `text` and `icon` on
        // `ContextMenuItem` with `successText` and `successIcon` which will fallback to
        // the `text` and `icon`
        onPress: (closePopover, {reportAction, selection}) => {
            const message = _.last(lodashGet(reportAction, 'message', null));
            const html = lodashGet(message, 'html', '');
            const text = Str.htmlDecode(selection || lodashGet(message, 'text', ''));
            const isAttachment = _.has(reportAction, 'isAttachment')
                ? reportAction.isAttachment
                : isReportMessageAttachment(text);
            if (!isAttachment) {
                Clipboard.setString(text);
            } else {
                Clipboard.setString(html);
            }
            if (closePopover) {
                hideContextMenu(true, ReportActionComposeFocusManager.focus);
            }
        },
    },

    {
        textTranslateKey: 'reportActionContextMenu.copyLink',
        icon: LinkCopy,
        shouldShow: () => false,
        onPress: () => {},
    },

    {
        textTranslateKey: 'reportActionContextMenu.markAsUnread',
        icon: Mail,
        successIcon: Checkmark,
        shouldShow: type => type === CONTEXT_MENU_TYPES.REPORT_ACTION,
        onPress: (closePopover, {reportAction, reportID}) => {
            updateLastReadActionID(reportID, reportAction.sequenceNumber);
            setNewMarkerPosition(reportID, reportAction.sequenceNumber);
            if (closePopover) {
                hideContextMenu(true, ReportActionComposeFocusManager.focus);
            }
        },
    },

    {
        textTranslateKey: 'reportActionContextMenu.editComment',
        icon: Pencil,
        shouldShow: (type, reportAction) => (
            type === CONTEXT_MENU_TYPES.REPORT_ACTION && canEditReportAction(reportAction)
        ),
        onPress: (closePopover, {reportID, reportAction, draftMessage}) => {
            const editAction = () => saveReportActionDraft(
                reportID,
                reportAction.reportActionID,
                _.isEmpty(draftMessage) ? getActionText(reportAction) : '',
            );

            if (closePopover) {
                // Hide popover, then call editAction
                hideContextMenu(false, editAction);
                return;
            }

            // No popover to hide, call editAction immediately
            editAction();
        },
    },
    {
        textTranslateKey: 'reportActionContextMenu.deleteComment',
        icon: Trashcan,
        shouldShow: (type, reportAction) => type === CONTEXT_MENU_TYPES.REPORT_ACTION
            && canDeleteReportAction(reportAction),
        onPress: (closePopover, {reportID, reportAction}) => {
            if (closePopover) {
                // Hide popover, then call showDeleteConfirmModal
                hideContextMenu(
                    false,
                    () => showDeleteModal(reportID, reportAction),
                );
                return;
            }

            // No popover to hide, call showDeleteConfirmModal immediately
            showDeleteModal(reportID, reportAction);
        },
    },
];

export {
    CONTEXT_MENU_TYPES,
};
