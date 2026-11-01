# ML — Machine Learning

This directory contains Agri2Value's machine learning components.

## Planned Scope (Phase 7)

- **Crop Disease Detection:** Image classification model for one pilot crop (tomato).
  - Training scripts using PyTorch / torchvision.
  - Evaluation reports (confusion matrix, per-class precision/recall/F1).
  - Model versioning.
- **Integration:** The trained model is called from `backend/app/crop_ai/` via a FastAPI inference endpoint.

## Status

> **Not yet implemented.** ML development begins in Phase 7.

## Directory Structure (When Implemented)

```
ml/
├── training/
│   ├── dataset_prep.py       # Data loading and augmentation
│   ├── train.py              # Training script
│   └── config.yaml           # Training hyperparameters
├── evaluation/
│   ├── evaluate.py           # Test-set evaluation script
│   └── results/              # Confusion matrices, metrics reports
├── models/                   # Trained model weights (gitignored)
│   └── .gitkeep
└── data/                     # Raw and processed datasets (gitignored)
    └── .gitkeep
```

## Safety Rules

- Model files (`*.pt`, `*.pkl`, `*.onnx`) are excluded from Git.
- Datasets are excluded from Git.
- No pesticide dosage recommendations from a classification model alone.
- Every prediction must include model version, confidence score and timestamp.
- Low-confidence predictions must route to "uncertain — seek expert confirmation".

## Data Attribution

All training datasets must be documented with:
- Source and license.
- Crop/disease classes and class counts.
- Train/validation/test split method.
- Photographer/collection attribution where required.
