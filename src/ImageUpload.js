import React, { useState, useRef, useEffect } from 'react';

const ImageUpload = ({ sendStop, isTextCleared, handleResponse, setRez}) => {


  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null); // New state for file URL
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [thumb, showThumb] = useState(false);

  // Effect to clear the response when isTextCleared is true
  useEffect(() => {
    if (isTextCleared) {
      setResponse(null); // Clear the response that controls the text display
      sendStop(); // Call this method from props to reset the isTextCleared in the parent
    }
  }, [isTextCleared, sendStop]);

  // Handle file input change
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setFileURL(URL.createObjectURL(selectedFile)); // Create a URL for the file
    showThumb(true);
  };

  // Handle prompt input change
  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  // Handle image upload
  const handleImageUpload = async () => {
    setRez("");
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    handleResponse('Analyzing your image', true)

    const formData = new FormData();
    formData.append('file', file);
    formData.append('stuff', prompt);
    setResponse('');

    try {
      // const response = await fetch('http://54.193.73.75:3001/sendImage', {
      const response = await fetch('http://localhost:3001/sendImage', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      console.log('File Response:', responseData);
      setResponse(responseData);
      handleResponse(responseData.content);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error communicating with the server.');
    }
  };

  // Handle prompt submission
  const handlePromptSubmit = async () => {
     setRez("");
      // sendStop()
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    // handleResponse(`${prompt}`);
    handleResponse('sure, one sec!', true);
    showThumb(false);

    try {
    //  const response = await fetch('http://54.193.73.75:3001/upload', {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      console.log('Upload Response:', responseData);
      setResponse(responseData);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error communicating with the server.');
    }
  };

  // Ref to handle image visibility toggle
  const imgRef = useRef(null);

  const toggleVisibility = () => {
    if (imgRef.current) {
      imgRef.current.style.display = imgRef.current.style.display === 'none' ? 'block' : 'none';
    }
  };

  return (
    <div style={{ color: 'lightgrey', position: 'fixed', marginTop: "11vh", width: "100vw", fontSize: '1.2rem' }}>
      <br /> <br />
      <button className="button2" onClick={handleImageUpload}>📷</button>
      <input className="button2"
        id="fileInput"
        type="file" 
        accept="image/*"
        capture="environment" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} // Hide default file input
      />

      <input className="button2"
        id="fileInput2"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }} // Hide default file input
      />
      
      <label htmlFor="fileInput" style={{
        display: 'inline-block',
        background: 'transparent',
        color: 'lightgrey',
        padding: '5px',
        borderRadius: '5px', marginRight: '4px',
        cursor: 'pointer',
      }}>
      Snap
      </label>

      <label htmlFor="fileInput2" style={{
        display: 'inline-block',
        background: 'transparent',
        color: 'lightgrey',
        padding: '5px',
        borderRadius: '5px',
        cursor: 'pointer',
      }}>
      +File
      </label>

      <br />
      <input className="button2 placeholder-style"
        type="text"
        value={prompt}
        
        onChange={handlePromptChange}
        placeholder="Ask about/create image"
        style={{
          backgroundColor: 'black',
          color: 'lightgrey',
          textAlign: 'center',
          borderRadius: '5px',
          padding: '10px',
          margin: '5px',
          border: '1px solid #ccc',
          width: '40vw'
        }}
      />

      <button className="button2" onClick={handlePromptSubmit}>🖼️</button>
      
      {fileURL && thumb && (
        <div style={{ textAlign: 'center', margin: 'auto', width: '100vw', position: 'absolute', top: '18vh'}}>
          <img src={fileURL} onClick={() => { showThumb(!thumb); }} style={{ margin: "auto", height: '30vh', borderRadius: '.8em' }} alt="Uploaded" />
        </div>
      )}
      
      {response && response.type === 'text' && (
        <div style={{ textAlign: 'center', width: '100vw', position: 'absolute', top: thumb ? '50vh' : '40vh', maxHeight: '30vh', overflow: 'auto' }}>
          <p style={{
            color: "rgb(53, 96, 251)",
            overflow: "hidden",
            overflowY: "auto", 
            margin: 'auto', 
            width: "80vw", 
          }}>{response.content}</p>
        </div>
      )}
      {response && response.type === 'image' && !isTextCleared && (
        <button className="button2" onClick={toggleVisibility} style={{ width: "100vw", position: 'absolute', top: 140, alignItems: 'center', background: 'transparent', zIndex: 50000, display: 'flex', justifyContent: 'center' }}>
          <img ref={imgRef} src={response.content} style={{ width: '50vh', zIndex: 4000, margin: 'auto', borderRadius: '2em'  }} alt="Generated" />
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
