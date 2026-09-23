const fs = require('fs');

let code = fs.readFileSync('src/components/Landing.jsx', 'utf8');
const searchString = '<Smartphone size={80} color="#ffd700" style={{ marginBottom: \'30px\' }} />';
const startIndex = code.indexOf(searchString);
if (startIndex !== -1) {
    const fixedBlock = `${searchString}
          <h2 className="font-heading" style={{ fontSize: '2.2rem', marginBottom: '15px', color: '#ffd700' }}>참가자</h2>
          <div style={{ background: '#ffd700', color: '#000', padding: '15px 30px', fontSize: '1.2rem', borderRadius: '12px', fontWeight: 800 }}>초대장 열기</div>
        </button>

      </div>

      <footer style={{
        marginTop: '60px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-sub)'
      }}>
        <div>RECREATION MASTER 100 — 100인 대규모 라이브 레크레이션 게임 엔진 &copy; 2026</div>
        <div style={{ marginTop: '8px', color: 'var(--primary-color)', fontWeight: 800 }}>
          버전: v1.6.3 (강력한 안티치트 꼼수 방지 시스템 및 테마 복구)
        </div>
      </footer>
    </div>
  );
};
`;
    code = code.substring(0, startIndex) + fixedBlock;
    fs.writeFileSync('src/components/Landing.jsx', code, 'utf8');
    console.log('Fixed Landing.jsx');
}
