/**
 * CỔNG TIẾP NHẬN HỌC VIÊN - HỌC VIỆN CHÍNH TRỊ (MOBILE PORTAL)
 */

let appData = {
  batches: [],
  allTargets: [],
  selectedBatch: null,
  selectedTarget: null,
  currentStep: 1,
  uploadedDocs: {}, // { [docType]: { fileName, contentBase64, previewUrl, size } }
  trackedStudent: null,
  supplementDocs: []
};

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initBirthdaySelects();
  initReceptionPortal();
});

function initBirthdaySelects() {
  // Điền danh sách ngày 1-31
  const dayEl = document.getElementById('recBdDay');
  if (dayEl) {
    for (let d = 1; d <= 31; d++) {
      const opt = document.createElement('option');
      opt.value = String(d).padStart(2, '0');
      opt.textContent = d;
      dayEl.appendChild(opt);
    }
  }
  // Điền danh sách năm từ năm hiện tại về 1950
  const yearEl = document.getElementById('recBdYear');
  if (yearEl) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearEl.appendChild(opt);
    }
  }
}


async function initReceptionPortal() {
  try {
    const res = await fetch('/api/reception/init-data');
    if (!res.ok) throw new Error('Không thể tải dữ liệu tiếp nhận.');
    const data = await res.json();
    appData.batches = data.batches || [];
    appData.allTargets = data.allTargets || [];

    renderBatchSelect();
    applyUrlPreset();   // Áp dụng tham số URL nếu có
  } catch (err) {
    showToast(err.message, 'error');
  }
}


function renderBatchSelect() {
  const select = document.getElementById('recBatchSelect');
  if (!select) return;

  if (!appData.batches.length) {
    select.innerHTML = '<option value="">-- Hiện chưa có đợt tiếp nhận nào đang mở --</option>';
    return;
  }

  select.innerHTML = '<option value="">-- Chọn đợt tiếp nhận --</option>' +
    appData.batches.map(b => `<option value="${b.id}">${escapeHtml(b.name)} (${b.academic_year || ''})</option>`).join('');

  // Tự động chọn đợt đầu tiên nếu chỉ có 1 đợt
  if (appData.batches.length === 1) {
    select.value = appData.batches[0].id;
    onRecBatchSelected();
  }
}

/**
 * Đọc URL params ?batch=ID&target=ID
 * Tự chọn và khoá các trường Đợt + Đối tượng khi học viên đến từ link/QR riêng.
 */
function applyUrlPreset() {
  const params = new URLSearchParams(window.location.search);
  const batchIdParam = params.get('batch');
  const targetIdParam = params.get('target');

  if (!batchIdParam) return;

  const batchSelect  = document.getElementById('recBatchSelect');
  const targetSelect = document.getElementById('recTargetSelect');
  if (!batchSelect) return;

  // Chọn Đợt tiếp nhận
  const batchId = Number(batchIdParam);
  const matchBatch = appData.batches.find(b => b.id === batchId);
  if (!matchBatch) {
    showToast('Liên kết đợt tiếp nhận không hợp lệ hoặc đã kết thúc.', 'error');
    return;
  }

  batchSelect.value = batchId;
  onRecBatchSelected();
  batchSelect.disabled = true;
  _showLockBadge('recBatchSelect', matchBatch.name);
  appData.urlPreset = { batchId, targetId: null };

  // Chọn Đối tượng (nếu có)
  const autoTarget = targetIdParam
    ? (matchBatch.targets || []).find(t => t.id === Number(targetIdParam))
    : (matchBatch.targets || []).length === 1 ? matchBatch.targets[0] : null;

  if (autoTarget) {
    setTimeout(() => {
      targetSelect.value = autoTarget.id;
      onRecTargetSelected();
      targetSelect.disabled = true;
      _showLockBadge('recTargetSelect', autoTarget.name);
      if (appData.urlPreset) appData.urlPreset.targetId = autoTarget.id;
    }, 60);
  }
}

/** Hiển thị badge khoá kế bên một select field */
function _showLockBadge(selectId, labelText) {
  const selectEl = document.getElementById(selectId);
  if (!selectEl) return;
  const oldBadge = selectEl.parentNode.querySelector('.preset-lock-badge');
  if (oldBadge) oldBadge.remove();
  const badge = document.createElement('div');
  badge.className = 'preset-lock-badge';
  badge.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
    <span>${escapeHtml(labelText)} — Được chỉ định từ liên kết đợt tiếp nhận</span>
  `;
  selectEl.parentNode.appendChild(badge);
}

function onRecBatchSelected() {

  const batchId = Number(document.getElementById('recBatchSelect').value);
  const targetSelect = document.getElementById('recTargetSelect');
  const targetInfoBox = document.getElementById('recTargetInfoBox');

  targetInfoBox.classList.add('hidden');
  appData.selectedBatch = appData.batches.find(b => b.id === batchId) || null;
  appData.selectedTarget = null;

  if (!appData.selectedBatch || !appData.selectedBatch.targets.length) {
    targetSelect.innerHTML = '<option value="">-- Đợt này chưa có đối tượng tiếp nhận --</option>';
    targetSelect.disabled = true;
    return;
  }

  targetSelect.disabled = false;
  targetSelect.innerHTML = '<option value="">-- Chọn đối tượng tiếp nhận --</option>' +
    appData.selectedBatch.targets.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');

  // Tự động chọn đối tượng đầu tiên nếu chỉ có 1
  if (appData.selectedBatch.targets.length === 1) {
    targetSelect.value = appData.selectedBatch.targets[0].id;
    onRecTargetSelected();
  }
}

function onRecTargetSelected() {
  const targetId = Number(document.getElementById('recTargetSelect').value);
  const targetInfoBox = document.getElementById('recTargetInfoBox');
  const previewClass = document.getElementById('previewClass');
  const previewDesc = document.getElementById('previewDesc');
  const previewDocsList = document.getElementById('previewDocsList');

  if (!targetId || !appData.selectedBatch) {
    targetInfoBox.classList.add('hidden');
    appData.selectedTarget = null;
    return;
  }

  const target = appData.selectedBatch.targets.find(t => t.id === targetId);
  if (!target) return;

  appData.selectedTarget = target;
  previewClass.textContent = target.default_class || 'Theo quy định';
  previewDesc.textContent = target.description || 'Học viên đối tượng đào tạo theo chỉ tiêu kế hoạch của Học viện.';

  const docs = Array.isArray(target.required_documents) ? target.required_documents : [];
  previewDocsList.innerHTML = docs.length
    ? docs.map((d, i) => `<li><span class="doc-num">${i + 1}.</span> ${escapeHtml(d)}</li>`).join('')
    : '<li>Theo hướng dẫn của Ban Tiếp nhận khi nhập học</li>';

  targetInfoBox.classList.remove('hidden');

  // Chuẩn bị các khung upload ảnh ở Bước 3
  buildUploadCards(docs);
}

function buildUploadCards(docNames) {
  const container = document.getElementById('recUploadCardsContainer');
  if (!container) return;

  if (!docNames.length) {
    container.innerHTML = `
      <div class="mobile-card empty-card">
        <p>Đối tượng này không yêu cầu tải trước văn bằng. Đồng chí có thể tiếp tục sang bước xác nhận.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = docNames.map((name, index) => `
    <div class="mobile-card upload-doc-card" id="cardDoc_${index}">
      <div class="upload-doc-header">
        <div class="upload-doc-title">
          <span class="doc-badge-step">${index + 1}</span>
          <strong>${escapeHtml(name)}</strong>
        </div>
        <span class="doc-status-tag" id="tagDoc_${index}">Chưa tải lên</span>
      </div>

      <div class="upload-doc-body" id="bodyDoc_${index}">
        <label class="btn-take-photo">
          <input type="file" accept="image/*,application/pdf" capture="environment" class="file-input-hidden" onchange="handleFileSelected(event, '${escapeAttr(name)}', ${index})" />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          Chụp ảnh / Tải tệp (Ảnh hoặc PDF)
        </label>
      </div>

      <div class="upload-preview-wrap hidden" id="prevWrap_${index}">
        <img id="imgPrev_${index}" src="" alt="Xem trước" class="upload-thumb" />
        <div class="prev-details">
          <span id="namePrev_${index}" class="prev-filename"></span>
          <span id="sizePrev_${index}" class="prev-filesize"></span>
          <button type="button" class="btn-delete-img" onclick="removeUploadedDoc('${escapeAttr(name)}', ${index})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Xóa / Tải lại
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

const PDF_ICON_DATA_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none"><rect width="24" height="24" rx="4" fill="%23fee2e2"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="%23dc2626" stroke-width="1.5"/><path d="M14 2v6h6" stroke="%23dc2626" stroke-width="1.5"/><text x="12" y="17" fill="%23dc2626" font-size="6" font-weight="bold" text-anchor="middle" font-family="sans-serif">PDF</text></svg>';

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không thể đọc tệp PDF.'));
    reader.readAsDataURL(file);
  });
}

// Nén ảnh bằng Canvas phía client trước khi upload
async function compressImage(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Lỗi xử lý hình ảnh.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.readAsDataURL(file);
  });
}

async function handleFileSelected(event, docType, index) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    let contentBase64;

    if (isPdf) {
      showToast('Đang tải tệp PDF...', 'info');
      contentBase64 = await readFileAsBase64(file);
    } else {
      showToast('Đang tối ưu dung lượng ảnh...', 'info');
      contentBase64 = await compressImage(file);
    }

    // Tính dung lượng ước lượng
    const sizeKb = Math.round((contentBase64.length * 3) / 4 / 1024);

    appData.uploadedDocs[docType] = {
      docType,
      fileName: file.name || (isPdf ? `${docType}.pdf` : `${docType}.jpg`),
      contentBase64,
      sizeKb,
      isPdf
    };

    // Cập nhật giao diện thẻ
    const prevWrap = document.getElementById(`prevWrap_${index}`);
    const bodyDoc = document.getElementById(`bodyDoc_${index}`);
    const imgPrev = document.getElementById(`imgPrev_${index}`);
    const namePrev = document.getElementById(`namePrev_${index}`);
    const sizePrev = document.getElementById(`sizePrev_${index}`);
    const tagDoc = document.getElementById(`tagDoc_${index}`);

    imgPrev.src = isPdf ? PDF_ICON_DATA_URL : contentBase64;
    imgPrev.onclick = () => previewFullImg(contentBase64);
    namePrev.textContent = file.name || (isPdf ? 'Tài liệu PDF' : 'Ảnh văn bằng');
    sizePrev.textContent = `${sizeKb} KB ${isPdf ? '(PDF)' : '(Đã tối ưu)'}`;
    tagDoc.textContent = isPdf ? 'Đã tải PDF' : 'Đã tải ảnh';
    tagDoc.className = 'doc-status-tag tag-success';

    bodyDoc.classList.add('hidden');
    prevWrap.classList.remove('hidden');

    showToast('Đã chụp/chọn ảnh thành công!');
  } catch (err) {
    showToast('Lỗi khi xử lý ảnh: ' + err.message, 'error');
  }
}

function removeUploadedDoc(docType, index) {
  delete appData.uploadedDocs[docType];

  const prevWrap = document.getElementById(`prevWrap_${index}`);
  const bodyDoc = document.getElementById(`bodyDoc_${index}`);
  const tagDoc = document.getElementById(`tagDoc_${index}`);

  tagDoc.textContent = 'Chưa tải ảnh';
  tagDoc.className = 'doc-status-tag';
  prevWrap.classList.add('hidden');
  bodyDoc.classList.remove('hidden');
}

// Chuyển đổi giữa các bước
function goToStep(step) {
  if (step > appData.currentStep) {
    // Validate trước khi sang bước tiếp theo
    if (appData.currentStep === 1) {
      if (!document.getElementById('recBatchSelect').value) {
        showToast('Vui lòng chọn Đợt tiếp nhận.', 'error');
        return;
      }
      if (!document.getElementById('recTargetSelect').value) {
        showToast('Vui lòng chọn Đối tượng tiếp nhận.', 'error');
        return;
      }
    } else if (appData.currentStep === 2) {
      const name = document.getElementById('recFullName').value.trim();
      const bdDay = document.getElementById('recBdDay').value;
      const bdMonth = document.getElementById('recBdMonth').value;
      const bdYear = document.getElementById('recBdYear').value;
      const bplace = document.getElementById('recBirthplace').value.trim();
      const htown = document.getElementById('recHometown').value.trim();
      const rank = document.getElementById('recRank').value;
      const gender = document.getElementById('recGender').value;
      const pos = document.getElementById('recPosition').value.trim();
      const unit = document.getElementById('recUnit').value.trim();
      const edu = document.getElementById('recEducationLevel').value.trim();
      const phone = document.getElementById('recPhone').value.trim();

      if (!name || !bdDay || !bdMonth || !bdYear || !bplace || !htown || !rank || !gender || !pos || !unit || !edu || !phone) {
        showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*).', 'error');
        return;
      }
    } else if (appData.currentStep === 3) {
      // Chuẩn bị dữ liệu hiển thị tóm tắt ở bước 4
      populateReviewSummary();
    }
  }

  // Chuyển step UI
  for (let i = 1; i <= 4; i++) {
    const box = document.getElementById(`stepBox${i}`);
    const ind = document.getElementById(`stepIndicator${i}`);
    const line = document.getElementById(`stepLine${i - 1}`);

    if (i === step) {
      box.classList.add('active');
      ind.classList.add('active');
    } else {
      box.classList.remove('active');
      if (i < step) {
        ind.classList.add('completed');
        ind.classList.remove('active');
      } else {
        ind.classList.remove('completed');
        ind.classList.remove('active');
      }
    }

    if (line) {
      if (i <= step) line.classList.add('active');
      else line.classList.remove('active');
    }
  }

  appData.currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateReviewSummary() {
  const bdDay = document.getElementById('recBdDay').value;
  const bdMonth = document.getElementById('recBdMonth').value;
  const bdYear = document.getElementById('recBdYear').value;
  const birthday = (bdDay && bdMonth && bdYear) ? `${bdDay}/${bdMonth}/${bdYear}` : '';

  document.getElementById('sumFullName').textContent = (document.getElementById('recFullName').value || '').toUpperCase();
  document.getElementById('sumBirthday').textContent = birthday;
  const gender = document.getElementById('recGender').value;
  document.getElementById('sumRankPos').textContent = `${document.getElementById('recRank').value}${gender ? ' - ' + gender : ''} - ${document.getElementById('recPosition').value}`;
  document.getElementById('sumUnit').textContent = document.getElementById('recUnit').value;
  document.getElementById('sumPhone').textContent = document.getElementById('recPhone').value;
  document.getElementById('sumTarget').textContent = appData.selectedTarget ? appData.selectedTarget.name : '';
  
  const docsCount = Object.keys(appData.uploadedDocs).length;
  document.getElementById('sumDocsCount').textContent = `${docsCount} tệp văn bằng/chứng chỉ`;
}


// Nộp hồ sơ chính thức
async function submitReceptionForm(event) {
  event.preventDefault();

  const commitment = document.getElementById('recCommitmentCheck');
  if (!commitment.checked) {
    showToast('Đồng chí vui lòng tích cam đoan trước khi nộp.', 'error');
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitDossier');
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = 'Đang gửi hồ sơ...';

  try {
    const documents = Object.values(appData.uploadedDocs).map(d => ({
      docType: d.docType,
      fileName: d.fileName,
      contentBase64: d.contentBase64
    }));

    const bdDay = document.getElementById('recBdDay').value;
    const bdMonth = document.getElementById('recBdMonth').value;
    const bdYear = document.getElementById('recBdYear').value;
    const birthday = (bdDay && bdMonth && bdYear) ? `${bdDay}/${bdMonth}/${bdYear}` : '';

    const payload = {
      batchId: Number(document.getElementById('recBatchSelect').value),
      targetId: Number(document.getElementById('recTargetSelect').value),
      orderIndex: document.getElementById('recOrderIndex').value ? Number(document.getElementById('recOrderIndex').value) : null,
      fullName: document.getElementById('recFullName').value.trim().toUpperCase(),
      birthday,
      gender: document.getElementById('recGender').value,
      birthplace: document.getElementById('recBirthplace').value.trim(),
      hometown: document.getElementById('recHometown').value.trim(),
      idCard: document.getElementById('recIdCard').value.trim(),
      rank: document.getElementById('recRank').value,
      position: document.getElementById('recPosition').value.trim(),
      unit: document.getElementById('recUnit').value.trim(),
      educationLevel: document.getElementById('recEducationLevel').value.trim(),
      phone: document.getElementById('recPhone').value.trim(),
      email: document.getElementById('recEmail').value.trim(),
      className: appData.selectedTarget ? appData.selectedTarget.default_class : '',
      declarationDate: new Date().toISOString().slice(0, 10),
      declarationPlace: 'Hà Nội',
      documents
    };

    const res = await fetch('/api/reception/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể gửi hồ sơ.');

    // Hiển thị màn hình thành công
    document.getElementById('receptionForm').classList.add('hidden');
    const stepperBar = document.getElementById('stepperBar');
    if (stepperBar) stepperBar.classList.add('hidden');

    const successBox = document.getElementById('recSuccessBox');
    document.getElementById('successStudentCode').textContent = data.studentCode;
    successBox.classList.remove('hidden');

    appData.lastSubmittedCode = data.studentCode;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('✅ Nộp hồ sơ thành công!', 'success');
    launchConfetti();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      NỘP HỒ SƠ TIẾP NHẬN
    `;
  }
}

function resetReceptionForm() {
  document.getElementById('receptionForm').reset();
  document.getElementById('receptionForm').classList.remove('hidden');
  const stepperBar = document.getElementById('stepperBar');
  if (stepperBar) stepperBar.classList.remove('hidden');
  document.getElementById('recSuccessBox').classList.add('hidden');
  appData.uploadedDocs = {};
  goToStep(1);
}

function trackCurrentStudentCode() {
  if (!appData.lastSubmittedCode) return;
  switchReceptionTab('track');
  document.getElementById('trackKeywordInput').value = appData.lastSubmittedCode;
  document.getElementById('btnTrackSubmit').click();
}

function copyStudentCode() {
  const code = document.getElementById('successStudentCode')?.textContent || '';
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    showToast('✅ Đã sao chép mã hồ sơ: ' + code, 'success');
  }).catch(() => {
    // Fallback cho thiết bị cũ
    const el = document.createElement('textarea');
    el.value = code;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('✅ Đã sao chép mã hồ sơ!', 'success');
  });
}


// ==========================================================
// TAB 2: TRA CỨU TIẾN ĐỘ HỒ SƠ
// ==========================================================
function switchReceptionTab(tab) {
  const btnSubmit = document.getElementById('btnTabSubmit');
  const btnTrack = document.getElementById('btnTabTrack');
  const secSubmit = document.getElementById('receptionSubmitSection');
  const secTrack = document.getElementById('receptionTrackSection');

  if (tab === 'submit') {
    btnSubmit.classList.add('active');
    btnTrack.classList.remove('active');
    secSubmit.classList.add('active');
    secTrack.classList.remove('active');
  } else {
    btnSubmit.classList.remove('active');
    btnTrack.classList.add('active');
    secSubmit.classList.remove('active');
    secTrack.classList.add('active');
  }
}

async function handleTrackDossier(event) {
  event.preventDefault();
  const keyword = document.getElementById('trackKeywordInput').value.trim();
  const phone = document.getElementById('trackPhoneInput').value.trim();
  const container = document.getElementById('trackResultContainer');
  const btn = document.getElementById('btnTrackSubmit');

  if (!keyword) return;

  btn.disabled = true;
  btn.textContent = 'Đang tra cứu...';
  container.classList.add('hidden');

  try {
    let url = `/api/reception/track?keyword=${encodeURIComponent(keyword)}`;
    if (phone) url += `&phone=${encodeURIComponent(phone)}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không tìm thấy hồ sơ.');

    appData.trackedStudent = data;
    renderTrackResult(data);
    container.classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = `
      <div class="mobile-card empty-card" style="margin-top: 16px;">
        <p style="color: var(--danger); font-weight: 600;">${escapeHtml(err.message)}</p>
        <small>Vui lòng kiểm tra lại Mã hồ sơ hoặc Số CCCD/CMND đã đăng ký.</small>
      </div>
    `;
    container.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      Tra cứu hồ sơ
    `;
  }
}

function renderTrackResult(student) {
  const container = document.getElementById('trackResultContainer');

  let statusBadgeHtml = '';
  let statusBannerHtml = '';

  if (student.status === 'Approved') {
    statusBadgeHtml = '<span class="status-badge approved">ĐÃ DUYỆT TIẾP NHẬN</span>';
    statusBannerHtml = `
      <div class="track-status-banner banner-success">
        <strong>Chúc mừng đồng chí đã được phê duyệt tiếp nhận!</strong>
        <p>Lớp biên chế: <strong>${escapeHtml(student.class_name || 'Lớp 23C')}</strong> ${student.order_index ? `&bull; STT bảng: <strong>${student.order_index}</strong>` : ''}</p>
        <div class="track-actions-row">
          <a href="/api/students/${student.id}/receipt-doc" class="btn primary btn-sm">Tải Phiếu tiếp nhận (.docx)</a>
          <a href="/api/students/${student.id}/download-bundle" class="btn secondary btn-sm">Tải trọn gói ZIP hồ sơ</a>
        </div>
      </div>
    `;
  } else if (student.status === 'Rejected') {
    statusBadgeHtml = '<span class="status-badge rejected">YÊU CẦU BỔ SUNG</span>';
    statusBannerHtml = `
      <div class="track-status-banner banner-warning">
        <strong>Hồ sơ cần bổ sung / chỉnh sửa:</strong>
        <p class="review-comment">"${escapeHtml(student.review_notes || 'Cán bộ yêu cầu nộp bổ sung ảnh văn bằng/chứng chỉ.')}"</p>
        <button class="btn primary btn-sm" onclick="openSupplementModal()">Bổ sung ảnh văn bằng ngay</button>
      </div>
    `;
  } else {
    statusBadgeHtml = '<span class="status-badge pending">ĐANG CHỜ THẨM ĐỊNH</span>';
    statusBannerHtml = `
      <div class="track-status-banner banner-info">
        <strong>Hồ sơ đang chờ Cán bộ Phòng Đào tạo thẩm định</strong>
        <p>Hồ sơ đã được tiếp nhận vào hệ thống. Cán bộ sẽ kiểm tra tính hợp lệ của thông tin và ảnh văn bằng trong thời gian sớm nhất.</p>
      </div>
    `;
  }

  const docs = student.documents || [];
  const docsListHtml = docs.length
    ? docs.map((d, i) => `
      <div class="track-doc-item">
        <span class="doc-num">${i + 1}</span>
        <div class="doc-info">
          <strong>${escapeHtml(d.doc_type)}</strong>
          <small>${escapeHtml(d.file_name)}</small>
        </div>
        <a href="/api/student-documents/${d.id}/file" target="_blank" class="btn outline btn-xs">Xem ảnh</a>
      </div>
    `).join('')
    : '<p style="font-size: 13px; color: var(--text-muted);">Chưa có ảnh văn bằng nào được tải lên.</p>';

  container.innerHTML = `
    <div class="mobile-card track-result-card">
      <div class="track-card-header">
        <div>
          <span class="track-code-label">MÃ HỒ SƠ:</span>
          <h3 class="track-code">${escapeHtml(student.student_code)}</h3>
        </div>
        ${statusBadgeHtml}
      </div>

      ${statusBannerHtml}

      <div class="track-info-section">
        <h4 class="track-sub-heading">THÔNG TIN HỌC VIÊN</h4>
        <div class="track-info-grid">
          <div class="track-info-row"><span>Họ và tên:</span><strong>${escapeHtml(student.full_name)}</strong></div>
          <div class="track-info-row"><span>Ngày sinh:</span><span>${escapeHtml(student.birthday || '')}</span></div>
          <div class="track-info-row"><span>Nơi sinh:</span><span>${escapeHtml(student.birthplace || '')}</span></div>
          <div class="track-info-row"><span>Quê quán:</span><span>${escapeHtml(student.hometown || '')}</span></div>
          <div class="track-info-row"><span>Cấp bậc:</span><strong>${escapeHtml(student.rank || '')}</strong></div>
          <div class="track-info-row"><span>Chức vụ:</span><span>${escapeHtml(student.position || '')}</span></div>
          <div class="track-info-row"><span>Đơn vị:</span><strong>${escapeHtml(student.unit || '')}</strong></div>
          <div class="track-info-row"><span>Trình độ học vấn:</span><span>${escapeHtml(student.education_level || '')}</span></div>
          <div class="track-info-row"><span>Số điện thoại:</span><span>${escapeHtml(student.phone || '')}</span></div>
          <div class="track-info-row"><span>Đợt tiếp nhận:</span><span>${escapeHtml(student.batch_name || 'Đợt 1')}</span></div>
          <div class="track-info-row"><span>Đối tượng đào tạo:</span><span>${escapeHtml(student.target_name || '')}</span></div>
        </div>
      </div>

      <div class="track-info-section">
        <h4 class="track-sub-heading">VĂN BẰNG, CHỨNG CHỈ ĐÃ NỘP (${docs.length})</h4>
        <div class="track-docs-list">
          ${docsListHtml}
        </div>
      </div>
    </div>
  `;
}

// Bổ sung tài liệu
function openSupplementModal() {
  const modal = document.getElementById('mobileSupplementModal');
  const container = document.getElementById('supplementUploadBoxes');
  appData.supplementDocs = [];

  container.innerHTML = `
    <div class="form-group">
      <label>Tên loại giấy tờ bổ sung:</label>
      <input id="suppDocType" placeholder="VD: Bằng đại học, Quyết định cử đi học..." />
    </div>
    <div class="form-group">
      <label class="btn-take-photo">
        <input type="file" accept="image/*,application/pdf" capture="environment" class="file-input-hidden" onchange="handleSupplementFile(event)" />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
        Chụp ảnh / Tải tệp (Ảnh hoặc PDF)
      </label>
    </div>
    <div id="suppPreviewWrap" class="upload-preview-wrap hidden">
      <img id="suppPreviewImg" src="" alt="Xem trước" class="upload-thumb" />
      <span id="suppFileName" class="prev-filename"></span>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeSupplementModal() {
  document.getElementById('mobileSupplementModal').classList.add('hidden');
}

async function handleSupplementFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    let contentBase64;
    if (isPdf) {
      showToast('Đang tải tệp PDF...', 'info');
      contentBase64 = await readFileAsBase64(file);
    } else {
      showToast('Đang tối ưu dung lượng ảnh...', 'info');
      contentBase64 = await compressImage(file);
    }

    appData.tempSupplement = {
      fileName: file.name || (isPdf ? 'BoSung.pdf' : 'BoSung.jpg'),
      contentBase64,
      isPdf
    };

    const prevWrap = document.getElementById('suppPreviewWrap');
    const imgEl = document.getElementById('suppPreviewImg');
    imgEl.src = isPdf ? PDF_ICON_DATA_URL : contentBase64;
    imgEl.onclick = () => previewFullImg(contentBase64);
    document.getElementById('suppFileName').textContent = file.name || (isPdf ? 'Tài liệu PDF' : 'Ảnh bổ sung');
    prevWrap.classList.remove('hidden');
    showToast('Đã chọn tệp bổ sung!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitSupplementFiles() {
  if (!appData.trackedStudent) return;
  if (!appData.tempSupplement || !appData.tempSupplement.contentBase64) {
    showToast('Vui lòng chụp hoặc chọn tệp cần bổ sung.', 'error');
    return;
  }

  const docType = document.getElementById('suppDocType').value.trim() || 'Văn bằng bổ sung';

  try {
    const payload = {
      documents: [
        {
          docType,
          fileName: appData.tempSupplement.fileName,
          contentBase64: appData.tempSupplement.contentBase64
        }
      ]
    };

    const res = await fetch(`/api/reception/supplement/${appData.trackedStudent.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể bổ sung.');

    closeSupplementModal();
    showToast('Đã bổ sung tài liệu thành công!');

    // Tải lại dữ liệu tra cứu
    document.getElementById('btnTrackSubmit').click();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Helpers
function previewFullImg(url) {
  if (!url) return;
  if (url.startsWith('data:application/pdf')) {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      window.location.href = url;
    }
  } else {
    window.open(url, '_blank');
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.classList.remove('hidden');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

function launchConfetti() {
  const colors = ['#166534','#22c55e','#86efac','#fbbf24','#3b82f6','#f472b6','#a78bfa'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    const size = 6 + Math.random() * 8;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 1.2;
    const duration = 2 + Math.random() * 1.5;
    const rotate = Math.random() * 360;
    const isCircle = Math.random() > 0.5;

    piece.style.cssText = `
      position:absolute;
      top:-20px;
      left:${left}%;
      width:${size}px;
      height:${isCircle ? size : size * 1.6}px;
      background:${color};
      border-radius:${isCircle ? '50%' : '2px'};
      opacity:0.9;
      animation:confettiFall ${duration}s ${delay}s ease-in forwards;
      transform:rotate(${rotate}deg);
    `;
    container.appendChild(piece);
  }

  // Inject keyframes nếu chưa có
  if (!document.getElementById('confettiStyle')) {
    const style = document.createElement('style');
    style.id = 'confettiStyle';
    style.textContent = `
      @keyframes confettiFall {
        0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.9; }
        80%  { opacity: 0.8; }
        100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Dọn dẹp sau 4 giây
  setTimeout(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 4000);
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}
