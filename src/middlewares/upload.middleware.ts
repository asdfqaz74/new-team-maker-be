import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// uploads 폴더 생성 (없으면)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // 파일명: timestamp_원본이름
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

// 파일 필터 (.rofl 파일만 허용)
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".rofl") {
    cb(null, true);
  } else {
    cb(new Error("ROFL 파일만 업로드 가능합니다."));
  }
};

// multer 설정
export const uploadRofl = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB 제한
  },
}).single("roflFile"); // 필드명: roflFile

// 업로드 후 파일 삭제 유틸
export const deleteUploadedFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
