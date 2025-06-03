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

  }

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


    console.log('update installed');
    await relaunch();


  } catch (error) {
    // 统一处理所有错误
    const errorMessage = error instanceof Error ? error.message : String(error);
    showStatus('下载更新失败', 'error');
    console.error('下载更新失败:', error);

    // 显示完整的错误信息
    updateLogEl.innerHTML = `
      <div class="text-red-500 font-medium">更新失败: ${errorMessage}</div>
      <div class="text-sm mt-1">请检查网络连接或稍后重试</div>
    `;

    downloadUpdateBtn.classList.remove('hidden');
  }




}

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