// src/popup.ts
console.log('Popup script loaded.');

// 安全創建 SVG 圖標的函數
function createSVGIcon(
	paths: string[],
	classes = 'h-4 w-4',
	viewBox = '0 0 24 24',
): SVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('class', classes);
	svg.setAttribute('fill', 'none');
	svg.setAttribute('viewBox', viewBox);
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '2');

	paths.forEach((pathData) => {
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('stroke-linecap', 'round');
		path.setAttribute('stroke-linejoin', 'round');
		path.setAttribute('d', pathData);
		svg.appendChild(path);
	});

	return svg;
}

// 箭頭圖標（填充樣式）
function createArrowIcon(): SVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('class', 'h-5 w-5');
	svg.setAttribute('viewBox', '0 0 20 20');
	svg.setAttribute('fill', 'currentColor');

	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('fill-rule', 'evenodd');
	path.setAttribute(
		'd',
		'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z',
	);
	path.setAttribute('clip-rule', 'evenodd');

	svg.appendChild(path);
	return svg;
}

// 輸入驗證函數
function validateInput(value: string, minLength: number = 2): string | null {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return 'This field cannot be empty';
	}
	if (trimmed.length < minLength) {
    return `At least ${minLength} characters are required`;
	}
	return null;
}

// 顯示錯誤訊息
function showError(element: HTMLElement, message: string) {
	// 移除現有錯誤訊息
	const existingError = element.parentNode?.querySelector('.error-message');
	if (existingError) {
		existingError.remove();
	}

	// 創建錯誤訊息元素
	const errorDiv = document.createElement('div');
	errorDiv.className = 'mt-1 text-sm text-red-500 error-message';
	errorDiv.textContent = message;

	// 添加錯誤樣式到輸入框
	element.classList.add('border-red-500', 'focus:ring-red-500');
	element.classList.remove('border-gray-300', 'focus:ring-blue-500');

	// 插入錯誤訊息
	element.parentNode?.insertBefore(errorDiv, element.nextSibling);
}

// 清除錯誤訊息
function clearError(element: HTMLElement) {
	const existingError = element.parentNode?.querySelector('.error-message');
	if (existingError) {
		existingError.remove();
	}

	// 恢復正常樣式
	element.classList.remove('border-red-500', 'focus:ring-red-500');
	element.classList.add('border-gray-300', 'focus:ring-blue-500');
}

document.addEventListener('DOMContentLoaded', () => {
	const saveButton = document.getElementById(
		'save-button',
	) as HTMLButtonElement;
	const promptTitleInput = document.getElementById(
		'prompt-title-input',
	) as HTMLInputElement;
	const promptInput = document.getElementById(
		'prompt-input',
	) as HTMLTextAreaElement;
	const promptList = document.getElementById('prompt-list') as HTMLDivElement;
	const searchInput = document.getElementById(
		'search-input',
	) as HTMLInputElement;

	// Apply initial Tailwind classes
	document.body.classList.add('bg-gray-100', 'p-4', 'w-80', 'font-sans');

	promptInput.classList.add(
		'w-full',
		'p-2',
		'border',
		'border-gray-300',
		'rounded-md',
		'mb-4',
		'focus:outline-none',
		'focus:ring-2',
		'focus:ring-blue-500',
		'max-h-[400px]',
		'h-32',
		'resize-y',
		'overflow-y-auto',
	);
	saveButton.classList.add(
		'w-full',
		'py-2',
		'px-4',
		'bg-blue-600',
		'text-white',
		'font-semibold',
		'rounded-md',
		'focus:outline-none',
		'focus:ring-2',
		'focus:ring-blue-500',
		'focus:ring-offset-2',
	);
	promptList.classList.add('mt-4', 'pb-2');

	// 添加輸入框的即時錯誤清除功能
	promptTitleInput.addEventListener('input', () => {
		clearError(promptTitleInput);
	});

	promptInput.addEventListener('input', () => {
		clearError(promptInput);
	});

	let allPrompts: { title: string; text: string; createdAt?: string }[] = [];

	// Load existing prompts
	chrome.storage.local.get({ prompts: [] }, (data) => {
		allPrompts = data.prompts;
		renderPrompts(allPrompts);
	});

	searchInput.addEventListener('input', () => {
		const searchTerm = searchInput.value.trim().toLowerCase();
		currentExpandedIndex = -1;
		if (searchTerm === '') {
			renderPrompts(allPrompts);
			return;
		}
		const filteredPrompts = allPrompts.filter(
			(prompt) =>
				prompt.title.toLowerCase().includes(searchTerm) ||
				prompt.text.toLowerCase().includes(searchTerm),
		);
		renderPrompts(filteredPrompts);
	});

	saveButton.addEventListener('click', () => {
		const newPromptTitle = promptTitleInput.value.trim();
		const newPromptText = promptInput.value.trim();

		// 清除之前的錯誤訊息
		clearError(promptTitleInput);
		clearError(promptInput);

		// 驗證輸入
		const titleError = validateInput(newPromptTitle, 2);
		const textError = validateInput(newPromptText, 2);

		let hasError = false;

		if (titleError) {
			showError(promptTitleInput, titleError);
			hasError = true;
		}

		if (textError) {
			showError(promptInput, textError);
			hasError = true;
		}

		// 如果有錯誤，不執行保存
		if (hasError) {
			return;
		}

		// 執行保存
		const now = new Date();
		const createdAt = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const newPrompt = {
			title: newPromptTitle,
			text: newPromptText,
			createdAt: createdAt,
		};
		allPrompts.push(newPrompt);
		chrome.storage.local.set({ prompts: allPrompts }, () => {
			renderPrompts(allPrompts);
			promptTitleInput.value = '';
			promptInput.value = '';
		});
	});

	let currentExpandedIndex = -1; // 追蹤當前展開的項目

	function renderPrompts(
		prompts: { title: string; text: string; createdAt?: string }[],
	) {
		promptList.innerHTML = '';
		currentExpandedIndex = -1; // 重置展開狀態

		prompts.forEach((prompt, index) => {
			const promptCard = document.createElement('div');
			promptCard.classList.add(
				'bg-white',
				'rounded-lg',
				'border',
				'border-gray-300',
				'rounded-lg',
				'shadow-sm',
				'overflow-hidden',
				'mb-2',
			);

			const promptHeader = document.createElement('div');
			promptHeader.classList.add(
				'flex',
				'items-center',
				'justify-between',
				'p-4',
				'cursor-pointer',
				'bg-white',
				'hover:bg-gray-200',
				'transition-colors',
				'duration-200',
			);

			const promptTitle = document.createElement('div');
			promptTitle.classList.add('flex-grow');

			const titleSpan = document.createElement('span');
			titleSpan.classList.add('font-semibold', 'text-gray-900', 'block');
			titleSpan.textContent = prompt.title;

			const dateSpan = document.createElement('span');
			dateSpan.classList.add('text-sm', 'text-gray-500');
			dateSpan.textContent = prompt.createdAt || '';

			promptTitle.appendChild(titleSpan);
			promptTitle.appendChild(dateSpan);

			const arrowIcon = document.createElement('div');
			arrowIcon.classList.add(
				'ml-2',
				'text-gray-600',
				'transition-transform',
				'duration-300',
			);
			arrowIcon.appendChild(createArrowIcon());

			promptHeader.appendChild(promptTitle);
			promptHeader.appendChild(arrowIcon);

			const promptContent = document.createElement('div');
			promptContent.classList.add(
				'relative',
				'px-4',
				'text-gray-700',
				'max-h-0',
				'overflow-hidden',
				'transition-all',
				'duration-300',
				'ease-in-out',
				'bg-gray-50',
			);

			const promptTextElement = document.createElement('div');
			promptTextElement.textContent = prompt.text;
			promptTextElement.classList.add(
				'whitespace-pre-wrap',
				'break-words',
				'my-2',
				'py-2',
				'px-6',
				'rounded-sm',
				'text-gray-700',
				'bg-gray-200',
			);

			// Button container with 3:1 ratio
			const buttonContainer = document.createElement('div');
			buttonContainer.classList.add(
				'sticky',
				'bottom-0',
				'bg-gray-50',
				'flex',
				'gap-2',
				'py-2',
				'px-4',
				'border-t',
				'border-gray-200',
			);

			// Copy button (3/4 width)
			const copyButton = document.createElement('button');
			copyButton.classList.add(
				'flex-[3]',
				'py-2',
				'px-3',
				'border',
				'border-gray-300',
				'rounded-md',
				'text-gray-700',
				'bg-white',
				'hover:bg-gray-50',
				'focus:outline-none',
				'focus:ring-2',
				'focus:ring-blue-500',
				'focus:ring-offset-2',
				'flex',
				'items-center',
				'justify-center',
				'gap-2',
				'transition-colors',
				'duration-200',
			);

			const copyIcon = createSVGIcon([
				'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
			]);
			const copyText = document.createTextNode(' Copy');
			copyButton.appendChild(copyIcon);
			copyButton.appendChild(copyText);

			copyButton.title = 'Copy prompt';
			copyButton.addEventListener('click', () => {
				navigator.clipboard
					.writeText(prompt.text)
					.then(() => {
						console.log('Prompt copied!');
						// 清空按鈕內容
						copyButton.innerHTML = '';

						// 添加成功圖標和文字
						const successIcon = createSVGIcon(['M5 13l4 4L19 7']);
						const successText = document.createTextNode(' Copied!');
						copyButton.appendChild(successIcon);
						copyButton.appendChild(successText);

						setTimeout(() => {
							// 恢復原始內容
							copyButton.innerHTML = '';
							const resetIcon = createSVGIcon([
								'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
							]);
							const resetText = document.createTextNode(' Copy');
							copyButton.appendChild(resetIcon);
							copyButton.appendChild(resetText);
						}, 1500);
					})
					.catch((err) => {
						console.error('Failed to copy prompt: ', err);
					});
			});

			// Delete button (1/4 width)
			const deleteButton = document.createElement('button');
			deleteButton.classList.add(
				'flex-[1]',
				'py-2',
				'px-3',
				'border',
				'border-red-300',
				'rounded-md',
				'text-red-700',
				'bg-white',
				'hover:bg-red-50',
				'focus:outline-none',
				'focus:ring-2',
				'focus:ring-red-500',
				'focus:ring-offset-2',
				'flex',
				'items-center',
				'justify-center',
				'transition-colors',
				'duration-200',
			);

			const deleteIcon = createSVGIcon([
				'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
			]);
			deleteButton.appendChild(deleteIcon);

			deleteButton.title = 'Delete prompt';
			deleteButton.setAttribute('aria-label', `Delete prompt: ${prompt.title}`);

			deleteButton.addEventListener('click', (e) => {
				e.stopPropagation();

				deleteButton.disabled = true;
				chrome.storage.local.get({ prompts: [] }, (data) => {
					const currentPrompts = data.prompts;
					const updatedPrompts = currentPrompts.filter(
						(p: { title: string; text: string; createdAt?: string }) =>
							!(
								p.title === prompt.title &&
								p.text === prompt.text &&
								p.createdAt === prompt.createdAt
							),
					);
					allPrompts = updatedPrompts;
					chrome.storage.local.set({ prompts: updatedPrompts }, () => {
						renderPrompts(updatedPrompts);
					});
				});
			});

			buttonContainer.appendChild(copyButton);
			buttonContainer.appendChild(deleteButton);

			promptContent.appendChild(promptTextElement);
			promptContent.appendChild(buttonContainer);

			promptCard.appendChild(promptHeader);
			promptCard.appendChild(promptContent);
			promptList.appendChild(promptCard);

			// Accordion toggle logic
			promptHeader.addEventListener('click', () => {
				// 如果點擊的是當前展開的項目，則收合
				if (currentExpandedIndex === index) {
					promptContent.classList.remove('max-h-96', 'overflow-y-auto');
					promptContent.classList.add('max-h-0');
					arrowIcon.classList.remove('rotate-180');
					currentExpandedIndex = -1;
				} else {
					// 先收合其他所有項目
					const allCards = promptList.querySelectorAll('.bg-white');
					allCards.forEach((card, cardIndex) => {
						const content = card.querySelector('.px-4');
						const arrow = card.querySelector('.ml-2');
						if (content && arrow) {
							content.classList.remove('max-h-96', 'overflow-y-auto');
							content.classList.add('max-h-0');
							arrow.classList.remove('rotate-180');
						}
					});

					// 展開當前項目
					promptContent.classList.remove('max-h-0');
					promptContent.classList.add('max-h-96', 'overflow-y-auto');
					arrowIcon.classList.add('rotate-180');
					currentExpandedIndex = index;
				}
			});
		});
	}
});
