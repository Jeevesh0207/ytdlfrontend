import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import axios from 'axios'
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import io from 'socket.io-client';
import { Player, Controls } from '@lottiefiles/react-lottie-player';

function Home() {
  const [SearchData, SetSearchData] = useState("")
  const [Title, SetTitle] = useState("")
  const [Duration, SetDuration] = useState("")
  const [Thumbnail, SetThumbnail] = useState("")
  const [AudioFile, SetAudioFile] = useState([])
  const [VideoFile, SetVideoFile] = useState([])
  const [isPageReady, SetisPageReady] = useState(true)
  const [isNotDownLoad,SetisNotDownLoad]=useState(false)

  const [isHome, SetisHome] = useState(true)
  const [isDownLoadStart, SetisDownLoadStart] = useState(false)
  const [isLoading, SetisLoading] = useState(true)
  const [Error, SetError] = useState(false)

  const [currentDuration, SetcurrentDuration] = useState(0);
  const [TotalDuration, SetTotalDuration] = useState(0);


  function formatDuration(seconds) {
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const addLeadingZero = (value) => (value < 10 ? `0${value}` : value);

    return `${addLeadingZero(minutes)}:${addLeadingZero(remainingSeconds)}`;
  }

  function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    if (bytes === 0) return '0 Byte';

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }

  // process.env.REACT_APP_YTDL_URL
  // "http://localhost:8000/"
  const SeachButton = async () => {

    SetisDownLoadStart(false)
    SetError(false)
    SetisLoading(true)
    SetisHome(false)
    const Data = {
      URL: SearchData
    }
    await axios.post(process.env.REACT_APP_YTDL_URL, Data).then((res) => {
      const Data = res.data
      // console.log(Data)
      if (Data === null) {
        SetisLoading(false)
        SetError(true)
      } else {
        SetTitle(Data.title)
        SetThumbnail(Data.thumbnails)
        SetDuration(formatDuration(Data.duration))
        SetAudioFile(Data.audioformats)
        SetVideoFile(Data.videoformats)
        SetisLoading(false)
        SetError(false)
      }
    }).catch((err) => {
      console.log(err)
      SetisLoading(false)
      SetError(true)
    })



  }

  const AudioDownLoad = async (item) => {
    window.open(item.url, "_blank");
  }

  // process.env.REACT_APP_SOCKET_URL
  // "http://localhost:4000/"
  const VideoDownLoad = async (item) => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    
    SetcurrentDuration(0)
    const Data = {
      ContentLength: item.contentLength,
      URL: SearchData,
      Duration: Duration
    }
    
    try {
      SetisNotDownLoad(false)
      SetisDownLoadStart(true)
      const response = await axios.post(process.env.REACT_APP_SOCKET_URL, Data, {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: 'arraybuffer',
      });
      if (response) {
        const url = window.URL.createObjectURL(new Blob([await response.data], { type: 'video/mkv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${Title}.mkv`); 
        document.body.appendChild(link);
        link.click();
        SetisDownLoadStart(false)
      } else {
        console.error("Failed to download video");
      }
    } catch (error) {
      SetisNotDownLoad(true)
      // SetisDownLoadStart(false)
      console.error(`Failed to merge videos: ${error.message}`);
    }
  }



  useEffect(
    () => {
      const socket = io(process.env.REACT_APP_SOCKET_URL);
      socket.connect();
      socket.on("data sent", (data) => {
        SetcurrentDuration(data.size);
        SetTotalDuration(data.duration);

        // console.log(data.size,data.duration)
      });

      return () => {
        socket.disconnect();
      }
    },
    []
  )

  useEffect(() => {
    const CheckSetup = async () => {
      await axios.get(process.env.REACT_APP_SOCKET_URL + 'checksetup').then((res) => {
        // console.log(res.data)
        if(res.data==="Ready"){
          SetisPageReady(false)
        }
      }).catch((err) => {
        console.log(err)
      })
    }
    CheckSetup()
  }, [])

  return (
    <>
      {
        (isPageReady) ?
          <div className='PageReady'>
            <h1>Please wait, I'm in the process of <span>connecting</span> to the page</h1>
            <Player
              autoplay
              loop
              src={require('../img/pagesetup.json')}
              className='loti-pagesetup'
            >
              <Controls visible={false} buttons={['play', 'repeat', 'frame', 'debug']} />
            </Player>
          </div> :
          <div>
            <Navbar />
            <div className='info-container'>
              <h1>
                Easy and Free 4K Video Downloader
              </h1>
              {/* <p>YT Downloader helps you download 4K videos without losing their quality. Read on to know more about it.
              </p> */}
              <p>By <span>Jeevesh Rai</span></p>
            </div>
            <div className='Search'>
              <div className='inputbox'>
                <div className='linklogo'>
                  <i className="fa-solid fa-link"></i>
                </div>
                <div className='inptarea'>
                  <input 
                  type='text' 
                  placeholder='Enter video link here...'
                  onChange={(e) => { SetSearchData(e.target.value) }
                  
                  }></input>
                </div>
                <div className='searchbtn' onClick={() => { (SearchData.trim().length) && SeachButton() }}>
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
              </div>
            </div>
            {
              (isDownLoadStart) &&
              <div className='slider'>
                {
                  (isNotDownLoad)?
                  <p>Unfortunately, downloading is not available for this video</p>:
                  <p>Grab a coffee! We're working on your download...</p>
                }
                <Slider
                  className='slider-bar'
                  value={currentDuration}
                  min={0}
                  max={TotalDuration}
                  trackStyle={{
                    backgroundColor: "#FAD961",
                    height: 20,
                    backgroundImage: "linear-gradient(90deg, #FAD961 0%, #F76B1C 100%)"
                  }}
                  railStyle={{
                    backgroundColor: "#2d2d2d",
                    height: 20,
                    // backgroundImage:"linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)", 
                  }}
                  handleStyle={{
                    display: "none"
                  }}
                />
              </div>
            }
            {
              (Error) ?
                <div className='Error'>
                  <img
                    src={require('../img/error.png')}
                    className='loti-error'
                    alt='png'
                  />
                  <h1>We apologize, but it seems that an unexpected issue has occurred</h1>
                </div> :
                (isHome) ?
                  <div className='Main-Page'>
                    <div className='Box Link'>
                      <div className='Top'>
                        <i className="fa-regular fa-paste"></i>
                      </div>
                      <div className='Bottom'>
                        <h2><span>1.</span> Paste Video Link</h2>
                        <p>Paste link YouTube or enter keyword into the search box. </p>
                      </div>
                    </div>
                    <div className='Box Select'>
                      <div className='Top'>
                        <i className="fa-brands fa-youtube"></i>
                      </div>
                      <div className='Bottom'>
                        <h2><span>2.</span> Select Video</h2>
                        <p>Select the format you want and then click the Download button. </p>
                      </div>
                    </div>
                    <div className='Box Down'>
                      <div className='Top'>
                        <i className="fa-solid fa-file-arrow-down"></i>
                      </div>
                      <div className='Bottom'>
                        <h2><span>3.</span> Download Video</h2>
                        <p>Wait a few seconds for the conversion to complete and click Download to download the file to your device. </p>
                      </div>
                    </div>
                  </div> :
                  (isLoading) ?
                    <div className='Loading'>
                      <div className='Circle-one'>
                        <div className='Circle-two'>

                        </div>
                      </div>
                    </div>
                    :
                    <div className='video-container'>
                      <div className='Left'>
                        <div className='banner'>
                          <img src={Thumbnail} alt='png' />
                        </div>
                        <p>{Title}</p>
                        <p><span>Duration : </span>{Duration}</p>
                      </div>
                      <div className='Right'>
                        <div className='sub-container'>
                          <div className='video-details'>
                            <div className='top'>
                              <h2>Video</h2>
                            </div>
                            <div className='all-formats'>
                              {
                                VideoFile.map((item, id) => (
                                  <div className='box' key={id}>
                                    <div className='row'>
                                      <div className='col quality'>
                                        <p>{item.qualityLabel}</p>
                                      </div>
                                      <div className='col size'>
                                        <p>{formatBytes(item.contentLength)}</p>
                                      </div>
                                      <div className='col down-btn' onClick={() => { (!isDownLoadStart)&&VideoDownLoad(item) }} >
                                        {/* <p>Download</p> */}
                                        <i className="fa-solid fa-cloud-arrow-down"></i>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                          <div className='video-details audio'>
                            <div className='top'>
                              <h2>Audio</h2>
                            </div>
                            <div className='all-formats'>
                              {
                                AudioFile.map((item, id) => (
                                  <div className='box' key={id}>
                                    <div className='row'>
                                      <div className='col quality'>
                                        <p>Audio</p>
                                      </div>
                                      <div className='col size'>
                                        <p>{formatBytes(item.contentLength)}</p>
                                      </div>
                                      <div className='col down-btn' onClick={() => { AudioDownLoad(item) }}>
                                        <i className="fa-solid fa-cloud-arrow-down"></i>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
            }
          </div>
      }
    </>
  )
}

export default Home