import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings, Save, AlertCircle } from 'lucide-react';
// 依照規範，引用全域共用常數與對話框
import { UI_THEME } from '../../../utils/constants';
import DialogModal from '../../../components/common/DialogModal';

/**
 * 模板積木類型定義
 */
const BLOCK_TYPES = [
  { type: 'rating', label: '評分 (1-5星)', icon: '⭐' },
  { type: 'checkbox', label: '核取方塊', icon: '☑️' },
  { type: 'select', label: '下拉標籤', icon: '🏷️' },
  { type: 'text', label: '多行文字', icon: '📝' },
  { type: 'image', label: '圖片上傳', icon: '🖼️' },
];

export default function TemplateEditor({ initialTemplate = [], onSave }) {
  const [blocks, setBlocks] = useState(initialTemplate);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);

  // 新增積木
  const handleAddBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      label: '新增欄位標題',
      ...(type === 'checkbox' || type === 'select' ? { options: ['選項 1'] } : {}),
      ...(type === 'rating' ? { max: 5 } : {})
    };
    setBlocks([...blocks, newBlock]);
  };

  // 請求刪除積木 (觸發 DialogModal)
  const requestDeleteBlock = (id) => {
    setBlockToDelete(id);
    setIsDialogOpen(true);
  };

  // 確認刪除積木
  const confirmDeleteBlock = () => {
    setBlocks(blocks.filter(b => b.id !== blockToDelete));
    setBlockToDelete(null);
    return true; // 關閉 Dialog
  };

  // 更新積木內容
  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // 渲染選項編輯器 (針對 checkbox 與 select)
  const renderOptionsEditor = (block) => {
    if (block.type !== 'checkbox' && block.type !== 'select') return null;
    return (
      <div className="mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
        <label className={`block text-xs font-bold mb-2 ${UI_THEME.TEXT_MUTED}`}>
          選項設定 (以逗號分隔)
        </label>
        <input
          type="text"
          className={`w-full p-2 text-sm ${UI_THEME.INPUT_BASE}`}
          value={block.options?.join(', ') || ''}
          onChange={(e) => updateBlock(block.id, 'options', e.target.value.split(',').map(s => s.trim()))}
          placeholder="例如: 良好, 普通, 需加強"
        />
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${UI_THEME.BACKGROUND}`}>
      {/* 頂部控制列 */}
      <div className={`p-4 flex justify-between items-center border-b ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_GLASS} sticky top-0 z-10`}>
        <div className="flex items-center gap-2">
          <Settings className={UI_THEME.TEXT_PRIMARY} size={20} />
          <h2 className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>日誌模板編輯器</h2>
        </div>
        <button 
          onClick={() => onSave(blocks)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${UI_THEME.BTN_PRIMARY}`}
        >
          <Save size={16} />
          儲存模板配置
        </button>
      </div>

      {/* 編輯區與工具列 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側積木工具列 */}
        <div className={`w-48 p-4 border-r ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} overflow-y-auto`}>
          <h3 className={`text-xs font-bold mb-4 ${UI_THEME.TEXT_MUTED}`}>加入新積木</h3>
          <div className="flex flex-col gap-2">
            {BLOCK_TYPES.map(bt => (
              <button
                key={bt.type}
                onClick={() => handleAddBlock(bt.type)}
                className={`flex items-center gap-2 p-3 rounded-lg text-sm font-bold text-left ${UI_THEME.BTN_SECONDARY}`}
              >
                <span>{bt.icon}</span>
                {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右側模板畫布 */}
        <div className={`flex-1 p-6 overflow-y-auto ${UI_THEME.CONTENT_AREA}`}>
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              <p className="font-bold">目前沒有積木，請從左側加入欄位。</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
              {blocks.map((block, index) => (
                <div 
                  key={block.id} 
                  className={`p-4 rounded-xl border flex gap-3 group transition-all ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT} hover:border-blue-400 dark:hover:border-blue-500`}
                >
                  <div className={`cursor-grab mt-2 text-slate-300 dark:text-slate-600 hover:text-blue-500`}>
                    <GripVertical size={20} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 ${UI_THEME.TEXT_SECONDARY}`}>
                        {BLOCK_TYPES.find(t => t.type === block.type)?.label || block.type}
                      </span>
                      <button 
                        onClick={() => requestDeleteBlock(block.id)}
                        className={`p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <input
                      type="text"
                      className={`w-full p-2 font-bold text-lg bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none transition-colors ${UI_THEME.TEXT_PRIMARY}`}
                      value={block.label}
                      onChange={(e) => updateBlock(block.id, 'label', e.target.value)}
                      placeholder="欄位標題..."
                    />

                    {renderOptionsEditor(block)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 刪除確認對話框 (遵循規範) */}
      <DialogModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="移除積木"
        message="確定要移除此欄位嗎？這不會刪除已填寫的歷史日誌，但未來的表單將不再顯示此欄位。"
        variant="danger"
        confirmText="確認移除"
        onConfirm={confirmDeleteBlock}
      />
    </div>
  );
}