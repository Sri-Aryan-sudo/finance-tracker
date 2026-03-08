import React, { Component } from 'react';
import { uploadCSV, downloadCSVTemplate } from '../../services/api';
import './index.css';

class UploadCSV extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragOver: false,
      uploading: false,
      result: null,
      error: null,
    };
    this.fileInputRef = React.createRef();
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleZoneClick = this.handleZoneClick.bind(this);
  }

  handleDragOver(e) {
    e.preventDefault();
    this.setState({ dragOver: true });
  }

  handleDragLeave() {
    this.setState({ dragOver: false });
  }

  handleDrop(e) {
    e.preventDefault();
    this.setState({ dragOver: false });
    const file = e.dataTransfer.files[0];
    if (file) this.processFile(file);
  }

  handleFileChange(e) {
    const file = e.target.files[0];
    if (file) this.processFile(file);
  }

  handleZoneClick() {
    this.fileInputRef.current && this.fileInputRef.current.click();
  }

  async processFile(file) {
    if (!file.name.endsWith('.csv')) {
      this.setState({ error: 'Please upload a CSV file.', result: null });
      return;
    }
    this.setState({ uploading: true, result: null, error: null });
    try {
      const result = await uploadCSV(file);
      this.setState({ result, error: null });
      if (this.props.onUploadSuccess) this.props.onUploadSuccess(result);
    } catch (err) {
      this.setState({ error: err.message, result: null });
    } finally {
      this.setState({ uploading: false });
    }
  }

  render() {
    const { dragOver, uploading, result, error } = this.state;

    return (
      <div>
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDrop={this.handleDrop}
          onDragOver={this.handleDragOver}
          onDragLeave={this.handleDragLeave}
          onClick={this.handleZoneClick}
        >
          <input
            ref={this.fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={this.handleFileChange}
          />
          <span className="material-icons-round upload-icon">cloud_upload</span>
          <div className="upload-title">
            {uploading ? 'Uploading...' : 'Drop your CSV file here'}
          </div>
          <div className="upload-subtitle">
            {uploading ? 'Processing your transactions...' : 'or click to browse files'}
          </div>
          {!uploading && (
            <button type="button" className="upload-btn" onClick={e => { e.stopPropagation(); this.handleZoneClick(); }}>
              <span className="material-icons-round" style={{ fontSize: 18 }}>attach_file</span>
              Browse CSV File
            </button>
          )}
          {uploading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <div className="spinner spinner-blue" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          )}
        </div>

        {result && (
          <div className="upload-result success">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 8 }}>
              <span className="material-icons-round">check_circle</span>
              Import Complete!
            </div>
            <p>✅ {result.inserted_count} transactions imported successfully.</p>
            {result.error_count > 0 && <p>⚠️ {result.error_count} rows had errors and were skipped.</p>}
            {result.errors && result.errors.length > 0 && (
              <ul className="upload-errors">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        {error && (
          <div className="upload-result error">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <span className="material-icons-round">error</span>
              Upload Failed
            </div>
            <p>{error}</p>
          </div>
        )}

        <div className="csv-instructions">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>CSV Format Requirements</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={downloadCSVTemplate}
            >
              <span className="material-icons-round" style={{ fontSize: 16 }}>download</span>
              Download Template
            </button>
          </div>
          <div className="csv-columns">
            {['date *', 'amount *', 'type *', 'category *', 'subcategory', 'payment_method', 'source', 'description'].map(col => (
              <span key={col} className={`csv-col-tag ${col.includes('*') ? 'required' : 'optional'}`}>
                {col}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
            * Required fields. <strong>type</strong> must be <code>income</code> or <code>expense</code>.
          </p>
          <div className="csv-example">{`date,amount,type,category,subcategory,payment_method,source,description
2024-01-15,50000,income,Salary,,Bank Transfer,TechCorp Inc,Monthly salary
2024-01-18,1200,expense,Food,Groceries,UPI,BigBasket,Weekly groceries
2024-01-20,800,expense,Travel,Cab,Card,Uber,Office commute`}</div>
        </div>
      </div>
    );
  }
}

export default UploadCSV;
