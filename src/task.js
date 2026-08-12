export const createAdapterError = (message, code, config, request, response) => {
  const error = new Error(message);

  error.name = code === "ERR_CANCELED" ? "CanceledError" : "AxiosError";
  error.code = code;
  error.config = config;
  error.request = request || null;
  if (response) {
    error.response = response;
  }
  if (code === "ERR_CANCELED") {
    error.__CANCEL__ = true;
  }

  return error;
};

export const settle = (resolve, reject, response) => {
  const validateStatus = response.config.validateStatus;

  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
    return;
  }

  const code = response.status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST";
  reject(
    createAdapterError(
      "Request failed with status code " + response.status,
      code,
      response.config,
      response.request,
      response
    )
  );
};

export const throwIfCancellationRequested = (config) => {
  if (config.cancelToken && config.cancelToken.throwIfRequested) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw createAdapterError("canceled", "ERR_CANCELED", config);
  }
};

export const bindCancellation = (config, task, cancel) => {
  const onCanceled = (reason) => {
    cancel(
      reason && !reason.type
        ? reason
        : createAdapterError("canceled", "ERR_CANCELED", config, task)
    );
  };

  if (config.cancelToken && config.cancelToken.subscribe) {
    config.cancelToken.subscribe(onCanceled);
  }
  if (config.signal) {
    config.signal.addEventListener("abort", onCanceled);
  }

  return () => {
    if (config.cancelToken && config.cancelToken.unsubscribe) {
      config.cancelToken.unsubscribe(onCanceled);
    }
    if (config.signal) {
      config.signal.removeEventListener("abort", onCanceled);
    }
  };
};

export const toAxiosProgressEvent = (progress, direction, previousLoaded) => {
  const loaded =
    direction === "upload" ? progress.totalBytesSent : progress.totalBytesWritten;
  const total =
    direction === "upload"
      ? progress.totalBytesExpectedToSend
      : progress.totalBytesExpectedToWrite;

  return {
    loaded,
    total: total > 0 ? total : undefined,
    progress: total > 0 ? loaded / total : progress.progress / 100,
    bytes: Math.max(loaded - previousLoaded, 0),
    upload: direction === "upload" || undefined,
    download: direction === "download" || undefined,
  };
};
