import React from 'react';
import { useModalContext } from '../../context/ModalContext';
import { useClassroomContext } from '../../context/ClassroomContext';
import { useAuth } from '../../context/AuthContext';
import { MODAL_ID } from '../../utils/constants';

// --- Global Modals ---
import DialogModal from './DialogModal';
import GlobalBackupModal from './GlobalBackupModal';

// --- Manager Modals ---
import LayoutTemplateModal from '../../pages/Manager/modals/LayoutTemplateModal';
import EditStudentModal from '../../pages/Manager/modals/EditStudentModal';
import BatchGroupModal from '../../pages/Manager/modals/BatchGroupModal';
import AttendanceModal from '../../pages/Manager/modals/AttendanceModal';
import ScoringModal from '../../pages/Manager/modals/ScoringModal';
import BehaviorSettingsModal from '../../pages/Manager/modals/BehaviorSettingsModal';
import ExportStatsModal from '../../pages/Manager/modals/ExportStatsModal';

const ModalRoot = () => {
    const {
        isModalOpen, closeModal, modalData,
        dialogConfig, closeDialog, openDialog
    } = useModalContext();

    // 嘗試取得 classroomContext，若沒被包裹在 Provider 內就不會執行到這裡
    // 但因為我們將 ModalRoot 放在 ClassroomOS 裡面，所以保證拿得到
    const classroomData = useClassroomContext();
    const { user, login } = useAuth();

    if (!classroomData) return null;

    const {
        currentClass,
        saveTemplate, deleteTemplate, applyTemplate,
        updateStudent, updateStudents, scoreStudent, resetScores, updateBehaviors, updateAttendance,
        templates, setHoveredGroup
    } = classroomData;

    // 封裝共用的 Dialog 觸發函式
    const handleShowDialog = (config) => {
        openDialog({
            ...config,
            onConfirm: (result) => {
                if (config.onConfirm) config.onConfirm(result);
                closeDialog();
            }
        });
    };

    return (
        <>
            <LayoutTemplateModal
                isOpen={isModalOpen(MODAL_ID.LAYOUT_TEMPLATE)} onClose={closeModal}
                currentLayout={currentClass?.layout} templates={templates}
                onApplyTemplate={applyTemplate} onSaveTemplate={saveTemplate} onDeleteTemplate={deleteTemplate}
                onShowDialog={handleShowDialog}
            />
            <EditStudentModal
                isOpen={isModalOpen(MODAL_ID.EDIT_STUDENT)} onClose={closeModal}
                student={modalData} onSave={updateStudent}
            />
            <BatchGroupModal
                isOpen={isModalOpen(MODAL_ID.BATCH_GROUP)} onClose={closeModal}
                students={currentClass?.students} onUpdateStudents={updateStudents}
                onShowDialog={handleShowDialog}
            />
            <AttendanceModal
                isOpen={isModalOpen(MODAL_ID.ATTENDANCE)} onClose={closeModal}
                students={currentClass?.students} attendanceRecords={currentClass?.attendanceRecords}
                onSave={updateAttendance}
                onShowDialog={handleShowDialog}
            />
            <ScoringModal
                isOpen={isModalOpen(MODAL_ID.SCORING)} student={modalData?.student || modalData}
                behaviors={currentClass?.behaviors}
                onClose={() => { closeModal(); if (setHoveredGroup) setHoveredGroup(null); }}
                onScore={scoreStudent} defaultMode={modalData?.mode || 'individual'}
            />
            <BehaviorSettingsModal
                isOpen={isModalOpen(MODAL_ID.BEHAVIOR_SETTINGS)} onClose={closeModal}
                behaviors={currentClass?.behaviors} onUpdateBehaviors={updateBehaviors} onResetScores={resetScores}
                onShowDialog={handleShowDialog}
            />
            <ExportStatsModal
                isOpen={isModalOpen(MODAL_ID.EXPORT_STATS)} onClose={closeModal}
                students={currentClass?.students} groupScores={currentClass?.groupScores}
                attendanceRecords={currentClass?.attendanceRecords || {}} onResetScores={resetScores}
                onShowDialog={handleShowDialog}
            />

            <GlobalBackupModal
                isOpen={isModalOpen('global_backup')}
                onClose={closeModal}
                user={user}
                login={login}
            />

            {/* 統一渲染 DialogModal */}
            {dialogConfig && dialogConfig.isOpen && (
                <DialogModal
                    {...dialogConfig}
                    onClose={() => {
                        if (dialogConfig.onClose) dialogConfig.onClose();
                        closeDialog();
                    }}
                />
            )}
        </>
    );
};

export default ModalRoot;
