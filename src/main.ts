// 修正导入方式
import { app, event } from '@tauri-apps/api';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
// import { checkUpdate, downloadUpdate, installUpdate } from '@tauri-apps/plugin-updater';

// DOM 元素类型定义
const currentVersionEl = document.getElementById('current-version') as HTMLSpanElement;
const checkUpdateBtn = document.getElementById('check-update-btn') as HTMLButtonElement;
const downloadUpdateBtn = document.getElementById('download-update-btn') as HTMLButtonElement;
// const installUpdateBtn = document.getElementById('install-update-btn') as HTMLButtonElement;
const updateStatusEl = document.getElementById('update-status') as HTMLDivElement;
const updateLogEl = document.getElementById('update-log') as HTMLDivElement;

// 状态类型
type StatusType = 'info' | 'success' | 'error' | 'warning' | 'loading';

// 显示当前应用版本
async function displayVersion(): Promise<void> {
  try {
    const version = await app.getVersion();
    console.log('获取版本号:', version);
    currentVersionEl.textContent = version;
  } catch (error) {
    console.error('获取版本号失败:', error);
    currentVersionEl.textContent = '未知';
    showStatus('获取版本号失败', 'error');
  }
}

// 显示状态消息
function showStatus(message: string, type: StatusType = 'info'): void {
  // 清空状态区域
  updateStatusEl.innerHTML = '';

  // 创建图标
  let iconClass = '';
  let bgColor = '';

  switch (type) {
    case 'success':
      iconClass = 'fa-check-circle text-success';
      bgColor = 'bg-green-50';
      break;
    case 'error':
      iconClass = 'fa-exclamation-circle text-danger';
      bgColor = 'bg-red-50';
      break;
    case 'warning':
      iconClass = 'fa-exclamation-triangle text-warning';
      bgColor = 'bg-yellow-50';
      break;
    case 'loading':
      iconClass = 'fa-spinner fa-spin text-primary';
      bgColor = 'bg-blue-50';
      break;
    default: // info
      iconClass = 'fa-info-circle text-primary';
      bgColor = 'bg-blue-50';
  }

  // 更新状态区域样式
  updateStatusEl.className = `w-full ${bgColor} rounded-lg p-6 text-center min-h-[120px] flex items-center justify-center`;

  // 创建消息元素
  const icon = document.createElement('i');
  icon.className = `fa ${iconClass} text-3xl mb-2`;

  const text = document.createElement('p');
  text.className = `text-gray-700 ${type === 'loading' ? 'mt-2' : ''}`;
  text.textContent = message;

  // 添加到状态区域
  if (type === 'loading') {
    updateStatusEl.appendChild(icon);
    updateStatusEl.appendChild(text);
  } else {
    const container = document.createElement('div');
    container.appendChild(icon);
    container.appendChild(text);
    updateStatusEl.appendChild(container);
  }
}

// 检查更新
async function checkForUpdates(): Promise<void> {
  showStatus('正在检查更新...', 'loading');

  try {

    const update = await check({
      timeout: 30000 /* milliseconds */,
      headers: {
        'X-AccessKey': 'mui2W50H1j-OC4xD6PgQag',
      },
    });

    if (update) {
      showStatus(`发现新版本 ${update?.version}`, 'warning');

      // 显示更新日志
      if (update.body) {
        updateLogEl.innerHTML = `<pre class="whitespace-pre-wrap">${update.body}</pre>`;
      } else {
        updateLogEl.innerHTML = '<p class="text-gray-600">无更新说明</p>';
      }

      // 显示下载按钮
      downloadUpdateBtn.classList.remove('hidden');
      // installUpdateBtn.classList.add('hidden');

    } else {

      showStatus('应用已是最新版本', 'success');
      updateLogEl.innerHTML = '<p class="italic text-gray-400">暂无更新日志</p>';
      downloadUpdateBtn.classList.add('hidden');
      // installUpdateBtn.classList.add('hidden');

    }

  } catch (error) {
    showStatus('检查更新失败', 'error');
    console.error('检查更新失败:', error);

    // 显示错误详情弹窗
    const errorMessage = error instanceof Error
        ? error.message
        : '未知错误，请稍后重试';

    showErrorDialog('更新检查失败', `检查更新过程中发生错误: ${errorMessage}`);

  }

}


// 显示错误对话框
function showErrorDialog(title: string, message: string) {

  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

  // 创建对话框
  const dialog = document.createElement('div');
  dialog.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all';

  // 对话框标题
  const dialogTitle = document.createElement('div');
  dialogTitle.className = 'bg-red-600 text-white px-6 py-3 font-medium';
  dialogTitle.textContent = title;

  // 对话框内容
  const dialogContent = document.createElement('div');
  dialogContent.className = 'px-6 py-4';
  dialogContent.innerHTML = `<p class="text-gray-800">${message}</p>`;

  // 对话框底部按钮
  const dialogFooter = document.createElement('div');
  dialogFooter.className = 'px-6 py-3 bg-gray-50 flex justify-end';

  // 确认按钮
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors';
  confirmBtn.textContent = '确定';
  confirmBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  // 组装对话框
  dialogFooter.appendChild(confirmBtn);
  dialog.appendChild(dialogTitle);
  dialog.appendChild(dialogContent);
  dialog.appendChild(dialogFooter);
  overlay.appendChild(dialog);

  // 添加到文档
  document.body.appendChild(overlay);

  // 点击遮罩层外部关闭对话框
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
}




// 下载更新
async function downloadUpdate(): Promise<void> {
  showStatus('正在下载更新...', 'loading');
  downloadUpdateBtn.classList.add('hidden');

  let downloaded = 0;
  let contentLength: number | undefined = 0;

  try {

    // 使用新的导入方式调用更新检查
    const update = await check({
      timeout: 30000 /* milliseconds */,
      headers: {
        'X-AccessKey': 'mui2W50H1j-OC4xD6PgQag',
      },
    });


    console.error('update:', update);

    if (update) {

      // alternatively we could also call update.download() and update.install() separately
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength;
            console.log(`started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            console.log(`downloaded ${downloaded} from ${contentLength}`);

            const percentage = Math.round((downloaded / 1000) * 100);

            showStatus(`下载进度: ${percentage}`, 'loading');
            break;
          case 'Finished':
            console.log('download finished');
            break;
        }
      });

    }


    showStatus('更新下载完成，准备安装', 'success');
    // installUpdateBtn.classList.remove('hidden');

  } catch (error) {
    showStatus('下载更新失败', 'error');
    console.error('下载更新失败:', error);
    downloadUpdateBtn.classList.remove('hidden');
  }


  console.log('update installed');
  await relaunch();

}

// 安装更新
// async function installUpdate(): Promise<void> {
//   showStatus('正在安装更新...', 'loading');
//   installUpdateBtn.classList.add('hidden');
//
//   try {
//     // 使用新的导入方式调用安装更新
//     await installUpdate();
//   } catch (error) {
//     showStatus('安装更新失败', 'error');
//     console.error('安装更新失败:', error);
//   }
// }

// 初始化
async function init(): Promise<void> {
  await displayVersion();

  // 添加事件监听器
  checkUpdateBtn.addEventListener('click', checkForUpdates);
  downloadUpdateBtn.addEventListener('click', downloadUpdate);
  // installUpdateBtn.addEventListener('click', installUpdate);

  // 监听更新状态变化
  await event.listen('tauri://update', (event) => {
    console.log('更新事件:', event.payload);
    // 可以在这里添加处理更新事件的逻辑
  });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);    